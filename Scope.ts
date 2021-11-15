import {InterRep} from "./InterRep.ts";

export class Scope {

    private parent: Scope | null;

    public commands: string[] = [];  // all commands that have been added so far
    private popWrapper: (commands: string[]) => string[];

    public offset: number;
    private vars: Map<string, number> = new Map();

    constructor(parent: Scope | null, offset: number, popWrapper?: (commands: string[]) => string[]) {
        this.parent = parent;
        this.offset = offset;
        this.popWrapper = popWrapper || (commands => commands);
    }

    /**
     * applies own popwrapper to commands, writes them to the parent and returns the parent
     */
    public pop(): Scope {

        if (!this.parent) throw new Error(`tried to pop lowest scope`);

        // pop variables from stack
        while (this.offset > this.parent.offset) {
            this.commands.push(InterRep.pop());
            this.offset--;
        }

        this.parent.commands.push(...this.popWrapper(this.commands));

        return this.parent;
    }

    /**
     * creates child (with reference to this scope) and returns it
     */
    public push(popWrapper?: (commands: string[]) => string[]): Scope {
        return new Scope(this, this.offset, popWrapper);
    }

    public declare(varname: string): number {
        const varOffset = this.offset;
        this.vars.set(varname, varOffset);
        this.offset += 1;  // grow by size of variable
        return varOffset;
    }

    public getOffset(varname: string): number {
        if (this.vars.has(varname)) return this.vars.get(varname)!;
        if (this.parent) return this.parent.getOffset(varname);
        throw new Error(`variable "${varname}" not in scope`);
    }

    public depth(): number {
        return 1 + (this.parent?.depth() || 0);
    }

    /**
     * Returns the total number of commands in all parents
     */
    public commandsBefore(): number {
        return this.parent?.commandsTotal() || 0;
    }

    public commandsTotal(): number {
        return this.commands.length + this.commandsBefore();
    }
}