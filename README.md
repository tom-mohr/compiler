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
deno run --allow-read run.ts <filename> [<function name> [arguments]]
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
