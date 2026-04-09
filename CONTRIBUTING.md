# Contributing

This is for code contributions.

## Basic Guidelines

### Always test your changes.

Do not submit something without at least building once to see if it compiles.  
If you are submitting a new game, make sure it has a name and description, and that it works correctly.

### Do not make formatting or "cleanup" PRs.

Yes, there are occurrences of trailing spaces, extra newlines, empty indents, and other tiny errors. No, I don't want to merge, view, or get notified by your 1-line PR fixing it. If you're implementing a PR with modification of _actual code_, feel free to fix formatting in the general vicinity of your changes, but please don't waste everyone's time with pointless changes.

I **especially** do not want to see PRs that apply any kind of automated analysis to the source code to "optimize" anything - my IDE can do that already. If the PR doesn't actually change anything useful, I'm not going to review or merge it.

### Do not make AI "contributions".

If I see a PR with significant amounts of code that's obviously written by AI, I will reject your PR, and you will be blocked. Don't waste my time with slop.

Asking AI questions, and using that information to help you write code? Fine. Using it to actually write code? No.

### Never change the package.json.

Never. Breaking things by adding dependencies is my job.

## Style Guidelines

### Use the Classes and Methods provided in src/engine/

Instead of writing your own Input Handler, just use the methods and classes that are already provided. I won't merge PR's that invent systems that already exist.

### Avoid bloated code and unnecessary getters/setters.

This is situational, but in essence, what it means is to avoid using any sort of getters and setters unless absolutely necessary. Public or protected fields should suffice for most things.
If something needs to be encapsulated in the future, IntelliJ can handle it with a few clicks.

## Other Notes

If you would like your name to appear in the credits, add it to the [list of contributors](https://github.com/htl-stp/games/blob/main/public/assets/contributors) as part of your PR.
