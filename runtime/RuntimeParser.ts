import {Runtime} from "./Runtime.ts";

const re = {
    load: /^load .+$/,//(0|(-?[1-9][0-9]*))
    push: /^push$/,
    pop: /^pop$/,
    write: /^write .+$/,
    read: /^read .+$/,
    jumpFunction: /^jumpFunction .+$/,
    return: /^return$/,
    jumpIfNot: /^jumpIfNot .+$/,
    jump: /^jump .+$/,
    native: /^native .+$/,
};

export class RuntimeParser extends Runtime {
    public runCommand(command: string): void {
        if (re.load.test(command)) {
            this.load(parseIntegerArgument(command));

        } else if (re.push.test(command)) {
            this.push();

        } else if (re.pop.test(command)) {
            this.pop();

        } else if (re.write.test(command)) {
            const relativePosition = parseIntegerArgument(command)
            this.write(relativePosition);

        } else if (re.read.test(command)) {
            const relativePosition = parseIntegerArgument(command)
            this.read(relativePosition);

        } else if (re.jumpFunction.test(command)) {
            const newPos = parseIntegerArgument(command);
            this.jumpFunction(newPos);

        } else if (re.return.test(command)) {
            this.return();

        } else if (re.jumpIfNot.test(command)) {
            const newPos = parseIntegerArgument(command);
            this.jumpIfNot(newPos);

        } else if (re.jump.test(command)) {
            const newPos = parseIntegerArgument(command);
            this.jump(newPos);

        } else if (re.native.test(command)) {
            const functionName = command.split(" ")[1];
            this.native(functionName);

        } else {
            throw this.error(`unknown command "${command}"`);
        }
    }
}

function parseIntegerArgument(command: string): number {
    return parseInt(command.split(" ")[1]);
}