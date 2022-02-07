import {Scope} from "./Scope.ts";

export class ScopeStack {

    public top: Scope = new Scope(null, 0);

    public push(popWrapper?: (commands: string[]) => string[]) {
        this.top = this.top.push(popWrapper);
    }

    public pop() {
        this.top = this.top.pop();
    }
}