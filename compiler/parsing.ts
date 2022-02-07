export function removeIndentation(line: string) {
    const cleanLine = line.replace(/^\s*/, "");
    return {
        i: line.length - cleanLine.length,
        cleanLine: cleanLine,
    };
}

export function splitAssignment(line: string) {
    const parts = line.split(/\s+=\s+/);
    return {
        varname: parts[0],
        expression: parts[1],
    }
}

export function splitCall(line: string) {

    let i = 0;

    // find start of parenthesis
    while (line[i] !== "(") {
        i++;
    }

    const functionName = line.slice(0, i).trim();

    const args: string[] = [];
    i++;
    let parStart = i;
    let depth = 0;
    // todo: should FIRST extract the content between the outer most brackets and then split this if it is not empty.
    while (i < line.length) {
        let c = line[i];
        // walk until you find a "," or ")" on the top level
        while (!(depth === 0 && (c === "," || c === ")"))) {
            if (c === "(") {
                depth++;
            } else if (c === ")") {
                depth--;
            }
            i++;
            c = line[i];
        }
        const argSlice = line.slice(parStart, i).trim();
        if (argSlice) {
            args.push(argSlice);
        }
        i++;
        parStart = i;
    }

    return {
        functionName: functionName,
        args: args,
    };
}

export function splitDeclaration(line: string) {
    return {
        varname: line.split(/\s+/)[1],
    };
}

export function splitIfStatement(line: string) {
    return {
        expression: line.split(/^if\s+/)[1],
    };
}

export function splitWhileStatement(line: string) {
    return {
        expression: line.split(/^while\s+/)[1],
    };
}

export function splitFunctionHead(line: string) {

    const i = 0;

    const j = line.search(/\(/);
    const k = line.search(/\)/);

    const functionName = line.slice(i, j).trim();

    const parameterSlice = line.slice(j + 1, k).trim();
    const parameters = parameterSlice ? parameterSlice.split(/\s*,\s*/) : [];

    return {
        functionName: functionName,
        parameters: parameters,
    };
}

export function isLineEmpty(line: string) {
    return /^\s*$/.test(line);
}

export function isLineComment(line: string) {
    return /^\s*\/\/.*$/.test(line);
}
