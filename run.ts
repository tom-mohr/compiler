import {parse} from "https://deno.land/std/flags/mod.ts";
import {Binary, Compiler} from "./compiler/Compiler.ts";
import {RuntimeParser} from "./runtime/Runtime.ts";

const args = parse(Deno.args);

const showDebugLog = args.debug;

const compiler = new Compiler();
const runtime = new RuntimeParser();

compiler.showDebugLog = showDebugLog;
runtime.showDebugLog = showDebugLog;

runTests();
main();

async function main() {
    if (args._.length) {

        // passed file
        const filename = args._[0] as string;
        const sourceCode = await Deno.readTextFile(filename);

        debug("\n------- compiler debug: --------\n");

        const bin: Binary | null = compileCode(sourceCode);
        if (bin === null) return;

        debug("\n------- compiler output: -------\n");

        debug(bin.commands.map((value, index) => `[${index}] ${value}`).join("\n"));

        debug("\n------- runtime debug: ---------\n");

        const mainFunctionCall = parseMainFunctionCallFrom(args._.slice(1));
        const akku = runCode(bin, mainFunctionCall.functionName, mainFunctionCall.args);
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

function compileCode(sourceCode: string): Binary | null {
    const lines = sourceCode.split(/\n/);
    try {
        return compiler.compile(lines);
    } catch (e) {
        console.error(`compiler error: ${(e as Error).message}`);
        return null;
    }
}

function runCode(bin: Binary, functionName: string, args: number[]): number | undefined {

    try {
        runtime.init(bin.functions.get(functionName)!, args);

        while (runtime.running) {
            runtime.runCommand(bin.commands[runtime.position]);
        }

        return runtime.akku;

    } catch (e) {
        console.error(`runtime error: ${(e as Error).message}`);
        return undefined;
    }
}

/**
 * Example: code.txt myMainFunction 1 2 3
 * @param args arguments to cli without file name
 */
function parseMainFunctionCallFrom(args: (string | number)[]) {
    if (args.length) {
        return {
            functionName: args[0] as string,
            args: args.slice(1) as number[],
        };
    } else {
        return {
            functionName: "main",
            args: [],
        };
    }
}

async function runTests() {

    const testDir = "./test/";
    for (const dirEntry of Deno.readDirSync(testDir)) {

        if (!dirEntry.isFile) continue;

        const sourceCode = await Deno.readTextFile(testDir + dirEntry.name);

        for (const {callArgs, result} of parseTestCases(sourceCode)) {
            if (!test(sourceCode, callArgs, result)) {
                console.warn(`test failed: ${(dirEntry.name)}\n\t"${callArgs}" did not return ${result}`);
            }
        }
    }
}

function test(sourceCode: string, callArgs: (string | number)[], result: number): boolean {
    const bin: Binary | null = compileCode(sourceCode);
    if (bin === null) return false;
    const mainFunctionCall = parseMainFunctionCallFrom(callArgs);
    const akku = runCode(bin, mainFunctionCall.functionName, mainFunctionCall.args);
    return akku === result;
}

function parseTestCases(sourceCode: string): TestCase[] {
    const lines = sourceCode.split(/\n/);
    return lines
        .filter(line => line.startsWith("//"))
        .map(line => line.slice("//".length).split(/\s*=\s*/))
        .map(parts => ({
            callArgs: parse(parts[0].split(" "))._,
            result: parseInt(parts[1]),
        }));
}

interface TestCase {
    callArgs: (string|number)[];
    result: number;
}