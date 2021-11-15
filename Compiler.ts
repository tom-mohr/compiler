import {InterRep} from "./InterRep.ts";
import {
    isLineComment,
    isLineEmpty,
    removeIndentation,
    splitAssignment,
    splitCall,
    splitDeclaration,
    splitFunctionHead,
    splitIfStatement, splitWhileStatement
} from "./parsing.ts";
import {ScopeStack} from "./ScopeStack.ts";

export interface Binary {
    commands: string[];
    functions: Map<string, number>;
}

export class Compiler {

    public showDebugLog = false;

    public indentation = 0;

    public readonly functionMap: Map<string, number> = new Map();
    private readonly scopes: ScopeStack = new ScopeStack();  // scope of current function
    private sourceCodeLineCounter = 0;  // for error messages

    public compile(lines: string[]): Binary {

        for (const line of lines) {
            this.compileLine(line);
        }

        this.setIndentation(0);  // make sure to pop any remaining scopes

        return {
            commands: this.scopes.top.commands,
            functions: this.functionMap
        };
    }

    public compileLine(line: string): void {
        if (!isLineEmpty(line) && !isLineComment(line)) {
            const {i, cleanLine} = removeIndentation(line);

            this.setIndentation(i);
            this.processLine(cleanLine.trim());
        }

        this.sourceCodeLineCounter++;
    }

    private setIndentation(i: number) {
        const change = i - this.indentation;
        if (change !== 0) {
            this.handleIndentationChange(change);
        }
        this.indentation = i;
    }

    private handleIndentationChange(indentationChange: number) {
        this.debug(`indentation changed by ${indentationChange}`);

        while (indentationChange > 0) {
            this.debug(`    -> push new scope`);
            this.scopes.push();
            indentationChange--;
        }
        while (indentationChange < 0) {
            this.debug(`    -> pop scope`);//todo: show variables that got popped
            this.scopes.pop();
            indentationChange++;
        }
    }

    private processLine(line: string): void {

        if (line === "") return;

        if (isLineComment(line)) {
            // comment
            this.debug("comment -> ignore");
            return;
        }

        if (this.scopes.top.depth() === 1) {
            // function head
            this.debug("function head");

            const {functionName, parameters} = splitFunctionHead(line);

            this.scopes.top.offset = -parameters.length;//important that this happens before pushing the new scope!

            this.debug(`    -> push new scope (indent by 1)`);
            this.scopes.push(commands => {
                this.debug(`    -> left function scope, insert return statement`);
                return [...commands, InterRep.return()];
            });
            this.indentation++;      // so that scope pops when leaving the function body

            this.functionMap.set(functionName, this.scopes.top.commandsBefore());

            // declare but don't push (already pushed):
            this.scopes.top.declare("return");
            this.debug(`    -> parameters: [${parameters}]`);
            for (const varname of parameters) {
                this.scopes.top.declare(varname);
            }

        } else if (line.startsWith("let ")) {
            // declaration
            this.debug("declaration");
            if (this.scopes.top.depth() === 1) throw this.error("declarations are only allowed inside functions");

            const {varname} = splitDeclaration(line);

            // declare in scope, push initial value
            this.scopes.top.declare(varname);
            this.scopes.top.commands.push(...[
                InterRep.load(0),
                InterRep.push(),
            ]);

        } else if (line.startsWith("if ")) {
            // if-statement
            this.debug("if");
            if (this.scopes.top.depth() === 1) throw this.error("if-statements are only allowed inside functions");

            const {expression} = splitIfStatement(line);

            this.evaluateExpression(expression);  // load evaluated result into akku

            this.debug(`    -> push new scope (if)`);
            this.scopes.push(commands => {
                this.debug(`    -> reached end of if`);
                return [
                    InterRep.jumpIfNot(this.scopes.top.commandsTotal() + 1),
                    ...commands,
                ];
            });
            this.indentation++;      // so that scope pops when leaving the if body

        } else if (line.startsWith("while ")) {
            // while-statement
            this.debug("while");
            if (this.scopes.top.depth() === 1) throw this.error("while-statements are only allowed inside functions");

            const {expression} = splitWhileStatement(line);

            // remember where to jump at end of loop
            const conditionStart = this.scopes.top.commandsTotal();

            this.evaluateExpression(expression);  // load evaluated result into akku

            this.debug(`    -> push new scope (while)`);
            this.scopes.push(commands => {
                this.debug(`    -> reached end of while`);
                return [
                    InterRep.jumpIfNot(this.scopes.top.commandsTotal() + 2),
                    ...commands,
                    InterRep.jump(conditionStart),
                ];
            });
            this.indentation++;      // so that scope pops when leaving the if body

        }else if (/[^=<>]=/.test(line)) {
            // assignment
            this.debug("assignment");
            if (this.scopes.top.depth() === 1) throw this.error("assignments only allowed inside functions");

            const {varname, expression} = splitAssignment(line);
            this.debug(`    -> varname "${varname}", expression "${expression}"`);
            this.evaluateExpression(expression);  // load evaluated result into akku
            this.scopes.top.commands.push(
                InterRep.write(this.scopes.top.getOffset(varname))  // write akku into variable
            );

        } else {
            // expression
            this.debug("expression");
            this.evaluateExpression(line);
        }
    }

    private evaluateExpression(expression: string): void {
        this.debug(`    -> evaluate expression "${expression}"`);
        const call = /^(([a-zA-Z_]([a-zA-Z0-9_]*))|[+\-*/^]|(==)|(!=)|(<)|(<=)|(>)|(>=)|!|&|\|)\(.*\)$/;
        const variable = /^[a-zA-Z][a-zA-Z0-9]*$/;
        const integer = /^(0|(-?[1-9][0-9]*))$/;

        if (call.test(expression)) {
            // call
            this.debug("    -> call");
            const {functionName, args} = splitCall(expression);
            this.evaluateFunctionCall(functionName, args);

        } else if (variable.test(expression)) {
            // variable
            this.debug("    -> variable");
            if (!this.scopes) throw this.error("variables can only be used inside functions");
            const varname = expression;
            this.scopes.top.commands.push(
                InterRep.read(this.scopes.top.getOffset(varname))
            );

        } else if (integer.test(expression)) {
            // integer
            this.debug("    -> integer");
            this.scopes.top.commands.push(
                InterRep.load(parseInt(expression))
            );

        } else {
            throw this.error(`cannot evaluate expression: "${expression}"`);
        }
    }

    private evaluateFunctionCall(functionName: string, args: string[]): void {
        if (this.functionMap.has(functionName)) {
            // user function call

            // push "return" with initial value
            this.scopes.top.commands.push(...[
                InterRep.load(0),
                InterRep.push(),
            ]);

            this.pushArguments(args);

            const functionLineNumber = this.functionMap.get(functionName)!;
            this.scopes.top.commands.push(
                InterRep.jumpFunction(functionLineNumber)  // will process stack and set value in akku
            );

        } else if (InterRep.natives.has(functionName)) {
            // native function call
            this.pushArguments(args);
            this.scopes.top.commands.push(
                InterRep.native(InterRep.natives.get(functionName)!)
            );

        } else {
            throw this.error(`function "${functionName}" undefined`);
        }
    }

    private pushArguments(args: string[]): void {
        for (const arg of args) {
            this.evaluateExpression(arg);  // loads value into akku
            this.scopes.top.commands.push(
                InterRep.push()            // puts akku onto stack
            );
        }
    }

    private error(msg: string) {
        return new Error(`(line ${this.sourceCodeLineCounter + 1}) ${msg}`);
    }

    private debug(text: string) {
        if (this.showDebugLog) console.debug(text);
    }
}
