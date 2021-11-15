const natives: Map<string, string> = new Map();

natives.set("add", "add");
natives.set("+", "add");

natives.set("sub", "sub");
natives.set("-", "sub");

natives.set("mul", "mul");
natives.set("*", "mul");

natives.set("div", "div");
natives.set("/", "div");

natives.set("pot", "pot");
natives.set("^", "pot");

natives.set("equal", "equal");
natives.set("==", "equal");

natives.set("notequal", "notequal");
natives.set("!=", "notequal");

natives.set("less", "less");
natives.set("<", "less");

natives.set("less_equal", "less_equal");
natives.set("<=", "less_equal");

natives.set("greater", "greater");
natives.set(">", "greater");

natives.set("greater_equal", "greater_equal");
natives.set(">=", "greater_equal");

natives.set("not", "not");
natives.set("!", "not");

natives.set("and", "and");
natives.set("&", "and");

natives.set("or", "or");
natives.set("|", "or");

natives.set("print", "print");

export class InterRep {

    public static natives = natives;

    public static load(value: number) {
        return `load ${value}`;
    }

    public static push() {
        return `push`;
    }

    public static pop() {
        return `pop`;
    }

    public static write(position: number) {
        return `write ${position}`;
    }

    public static read(position: number) {
        return `read ${position}`;
    }

    public static jumpFunction(lineNumber: number) {
        return `jumpFunction ${lineNumber}`;
    }

    public static return() {
        return `return`;
    }

    public static jumpIfNot(lineNumber: number) {
        return `jumpIfNot ${lineNumber}`;
    }

    public static jump(lineNumber: number) {
        return `jump ${lineNumber}`;
    }

    public static native(functionName: string) {
        return `native ${functionName}`;
    }
}