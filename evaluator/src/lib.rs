#![no_std]

extern crate alloc;

use alloc::{
    borrow::Cow,
    boxed::Box,
    collections::BTreeMap,
    format,
    string::{String, ToString},
    vec::Vec,
};
use chrono::{DateTime, FixedOffset, NaiveDate};
use rets_expression::{Engine, EvaluateContext};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn evaluate(rules: &str, value: &str, previous_value: &str, now: &str, date: &str) -> Result<JsValue, JsValue> {
    let now = DateTime::parse_from_rfc3339(now).map_err(|err| Error::JsonParseError { error: err.to_string() })?;
    let date = NaiveDate::parse_from_str(date, "%Y-%m-%d").map_err(|err| Error::JsonParseError { error: err.to_string() })?;
    let value: serde_json::Value = serde_json::from_str(value).map_err(|err| Error::JsonParseError { error: err.to_string() })?;
    let previous_value: serde_json::Value = serde_json::from_str(previous_value).map_err(|err| Error::JsonParseError { error: err.to_string() })?;
    let rules: Rules = serde_json::from_str(rules).map_err(|err| Error::JsonParseError { error: err.to_string() })?;

    let evaluated = rules.evaluate(value, previous_value, now, date)?;

    Ok(serde_wasm_bindgen::to_value(&evaluated).unwrap())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Error {
    JsonParseError { error: String },
    ExpressionParseError { error: String },
    ExpressionRuntimeError { error: String },
}

impl From<Error> for JsValue {
    fn from(value: Error) -> Self { serde_wasm_bindgen::to_value(&value).unwrap() }
}

#[derive(Debug, Deserialize)]
#[serde(transparent)]
struct Rules(Vec<Rule>);

impl Rules {
    pub fn evaluate(&self, value: serde_json::Value, previous_value: serde_json::Value, now: DateTime<FixedOffset>, today: NaiveDate) -> Result<Output, Error> {
        let engine = Engine::default()
            .with_function("NOW", Box::new(NowFunction))
            .with_function("TODAY", Box::new(TodayFunction));
        let time_state = TimeState { now, today };
        let mut locals = BTreeMap::new();
        let mut output = Output::default();
        let mut expressions = BTreeMap::new();

        for rule in &self.0 {
            let expression = match rule.rule_expression.parse::<rets_expression::Expression>() {
                Ok(expression) => expression,
                Err(err) => {
                    output.set_error(rule.id.clone(), err);
                    continue;
                }
            };
            expressions.insert(rule.id.clone(), expression);
        }

        for rule in self.0.iter() {
            let Some(expression) = expressions.get(&rule.id) else { continue };

            let context = EvaluateContext::new_with_state(&engine, &value, time_state).with_previous(&previous_value);

            match expression.apply_with_locals(context, &locals) {
                Ok(value) => {
                    if matches!(rule.rule_action, RuleAction::Set) {
                        locals.insert(&rule.field_name, value.clone());
                    }

                    output.set(rule.id.clone(), value);
                }
                Err(err) => {
                    output.set_error(rule.id.clone(), format!("{:?}", err));
                }
            }
        }

        for (key, value) in locals {
            output.set_update(key.to_string(), value.into_owned());
        }

        Ok(output)
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct Rule {
    #[serde(rename = "id")]
    id:              RuleId,
    field_name:      String,
    rule_action:     RuleAction,
    rule_expression: String,
}

#[derive(Debug)]
enum RuleAction {
    Set,
    Other(String),
}

impl<'de> Deserialize<'de> for RuleAction {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where D: serde::Deserializer<'de> {
        let value = String::deserialize(deserializer)?;
        if value == "SET" {
            Ok(RuleAction::Set)
        } else {
            Ok(RuleAction::Other(value))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(transparent)]
struct RuleId(String);

#[derive(Debug, Serialize, Default)]
struct Output {
    values:  BTreeMap<RuleId, OutputValue>,
    updates: BTreeMap<String, serde_json::Value>,
}

impl Output {
    pub fn set(&mut self, rule_id: RuleId, value: Cow<'_, serde_json::Value>) { self.values.insert(rule_id, OutputValue::Value { value: value.into_owned() }); }
    pub fn set_error(&mut self, rule_id: RuleId, error: String) { self.values.insert(rule_id, OutputValue::Error { error }); }
    pub fn set_update(&mut self, key: String, value: serde_json::Value) { self.updates.insert(key, value); }
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum OutputValue {
    Value { value: serde_json::Value },
    Error { error: String },
}

impl From<rets_expression::Error> for Error {
    fn from(value: rets_expression::Error) -> Self { Error::ExpressionRuntimeError { error: format!("{:?}", value) } }
}

#[derive(Copy, Clone)]
struct TimeState {
    now:   chrono::DateTime<chrono::FixedOffset>,
    today: chrono::NaiveDate,
}

struct TodayFunction;

impl rets_expression::function::Function<TimeState> for TodayFunction {
    fn evaluate<'json>(
        &self,
        context: rets_expression::function::FunctionContext<'_, TimeState>,
        _input: Vec<Cow<'json, Value>>,
    ) -> Result<Cow<'json, Value>, rets_expression::function::FunctionError> {
        let state = context.state();
        Ok(Cow::Owned(Value::String(state.today.format("%Y-%m-%d").to_string())))
    }
}

struct NowFunction;

impl rets_expression::function::Function<TimeState> for NowFunction {
    fn evaluate<'json>(
        &self,
        context: rets_expression::function::FunctionContext<'_, TimeState>,
        _input: Vec<Cow<'json, Value>>,
    ) -> Result<Cow<'json, Value>, rets_expression::function::FunctionError> {
        let state = context.state();
        Ok(Cow::Owned(Value::String(state.now.to_rfc3339_opts(chrono::SecondsFormat::Millis, true))))
    }
}
