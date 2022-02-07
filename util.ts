import {Binary, Compiler} from "./compiler/Compiler.ts";
import {RuntimeParser} from "./runtime/RuntimeParser.ts";

export function compileCode(compiler: Compiler, sourceCode: string): Binary | null {
    const lines = sourceCode.split(/\n/);
    try {
        return compiler.compile(lines);
    } catch (e) {
        console.error(`compiler error: ${(e as Error).message}`);
        return null;
    }
}

export function runCode(runtime: RuntimeParser, bin: Binary, functionName: string, args: number[]): number | undefined {

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
export function parseMainFunctionCallFrom(args: (string | number)[]) {
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