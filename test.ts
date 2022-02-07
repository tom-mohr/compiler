import {Binary, Compiler} from "./compiler/Compiler.ts";
import {parse} from "https://deno.land/std/flags/mod.ts";
import {RuntimeParser} from "./runtime/RuntimeParser.ts";
import {compileCode, parseMainFunctionCallFrom, runCode} from "./util.ts";

const args = parse(Deno.args);

const showDebugLog = args.debug;

const compiler = new Compiler();
const runtime = new RuntimeParser();

compiler.showDebugLog = showDebugLog;
runtime.showDebugLog = showDebugLog;

runTests();

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
    const bin: Binary | null = compileCode(compiler, sourceCode);
    if (bin === null) return false;
    const mainFunctionCall = parseMainFunctionCallFrom(callArgs);
    const akku = runCode(runtime, bin, mainFunctionCall.functionName, mainFunctionCall.args);
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
    callArgs: (string | number)[];
    result: number;
}