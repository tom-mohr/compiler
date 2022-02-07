import {parse} from "https://deno.land/std/flags/mod.ts";
import {Binary, Compiler} from "./compiler/Compiler.ts";
import {RuntimeParser} from "./runtime/RuntimeParser.ts";
import {compileCode, parseMainFunctionCallFrom, runCode} from "./util.ts";

const args = parse(Deno.args);

const showDebugLog = args.debug;

const compiler = new Compiler();
const runtime = new RuntimeParser();

compiler.showDebugLog = showDebugLog;
runtime.showDebugLog = showDebugLog;

main().then();

async function main() {
    if (args._.length) {

        // passed file
        const filename = args._[0] as string;
        const sourceCode = await Deno.readTextFile(filename);

        debug("\n------- compiler debug: --------\n");

        const bin: Binary | null = compileCode(compiler, sourceCode);
        if (bin === null) return;

        debug("\n------- compiler output: -------\n");

        debug(bin.commands.map((value, index) => `[${index}] ${value}`).join("\n"));

        debug("\n------- runtime debug: ---------\n");

        const mainFunctionCall = parseMainFunctionCallFrom(args._.slice(1));
        const akku = runCode(runtime, bin, mainFunctionCall.functionName, mainFunctionCall.args);
        if (akku === undefined) return;

        debug("\n------- return value: ----------\n");

        console.log(`${akku}`);

    } else {
        // print help
        console.log(`USAGE:
        deno run --allow-read run.ts <filename> [arguments]
EXAMPLE:
        deno run --allow-read run.ts "main" 1 2
        `);
    }
}

function debug(text: string) {
    if (showDebugLog) console.debug(text);
}

