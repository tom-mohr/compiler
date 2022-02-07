# About This Project

I wanted to see if I could create a programming language. It worked!

This project can be divided into two parts:
- The runtime, a simple stack machine that runs custom bytecode.
- The compiler, that can compile my custom language's source code into bytecode for the runtime.

# Example Code

```
fib(n)
    return = 1
    if >(n, 2)
        return = add(fib(add(n, -1)), fib(add(n, -2)))
```
This computes the n-th [Fibonacci number](https://en.wikipedia.org/wiki/Fibonacci_number).


# Project Setup

You need the following tools:
- [npm](https://www.npmjs.com/package/npm)
- [Deno](https://deno.land/)

After checking out the git repository, run `npm install` to install the dependencies.

# How to Compile and Execute Code

```sh
deno run --allow-read run.ts <filename> [<function name> [program arguments]]
```

Example:

1.  Save the following in a text file called `myprogram.txt`:

    ```
    myfunction(a, b, c)
        return = add(a, mul(b, c))
    ```
2.  Open the console inside the project directory and execute

    ```sh
    deno run --allow-read run.ts myprogram.txt myfunction 1 2 3
    ```
    
    This should print `7` to the console.
    If you stored your file in a diffent location, simply change `myprogram.txt` to the actual path of your file.

You can also add a `main()` function *to the end of your file*:

```
myfunction(a, b, c)
    return = add(a, mul(b, c))

main()
    return = myfunction(1, 2, 3)
```

The runtime looks for a "main" function by default. Therefore, you can now simply run:

```sh
deno run --allow-read run.ts myprogram.txt
```

To see what the compiler does, add the `--debug` flag when running your program from the console. This will show you:
- debug information while the compiler is compiling your code
- the compiler output (bytecode)
- debug information while the runtime is executing the bytecode

For the Fibonacci example above, the bytecode will look something like this:
```
[0]  load 1
[1]  write -1
[2]  read 0
[3]  push
[4]  load 2
[5]  push
[6]  native greater
[7]  jumpIfNot 30
[8]  load 0
[9]  push
[10] read 0
[11] push
[12] load -1
[13] push
[14] native add
[15] push
[16] jumpFunction 0
[17] push
[18] load 0
[19] push
[20] read 0
[21] push
[22] load -2
[23] push
[24] native add
[25] push
[26] jumpFunction 0
[27] push
[28] native add
[29] write -1
[30] pop
[31] pop
[32] return
```
