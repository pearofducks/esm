// A simplified and more accurate version of the dynamic-import acorn plugin.
// Copyright Jordan Gensler. Released under MIT license:
// https://github.com/kesne/acorn-dynamic-import

import { tokTypes as tt } from "acorn/dist/acorn.es.js"
import utils from "../utils.js"

const codeOfLeftParen = "(".charCodeAt(0)

function enable(parser) {
  // Allow `yield import()` to parse.
  tt._import.startsExpr = true
  parser.parseExprAtom = utils.wrapCall(parser.parseExprAtom, parseExprAtom)
  parser.parseStatement = utils.wrapCall(parser.parseStatement, parseStatement)
  return parser
}

function parseExprAtom(func, refDestructuringErrors) {
  const importPos = this.start

  if (this.eat(tt._import)) {
    if (this.type !== tt.parenL) {
      utils.parserRaise(this)
    }

    return this.finishNode(this.startNodeAt(importPos), "Import")
  }

  return func.call(this, refDestructuringErrors)
}

function parseStatement(func, declaration, topLevel, exported) {
  if (this.type === tt._import &&
      utils.parserLookahead(this).type === tt.parenL) {
    // import(...)
    const startPos = this.start
    const node = this.startNode()
    const callExpr = this.startNode()
    const callee = this.parseExprAtom()

    this.next()

    callExpr.arguments = [this.parseMaybeAssign()]
    callExpr.callee = callee
    this.finishNode(callExpr, "CallExpression")

    if (! this.eat(tt.parenR)) {
      utils.parserRaise(this)
    }

    const expr = this.parseSubscripts(callExpr, startPos)
    return this.parseExpressionStatement(node, expr)
  }

  return func.call(this, declaration, topLevel, exported)
}

export { enable }
