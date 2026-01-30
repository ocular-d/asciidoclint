[**@testthedocs/core**](../README.md)

***

[@testthedocs/core](../README.md) / LintRule

# Interface: LintRule

Defined in: [types/index.ts:28](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/types/index.ts#L28)

## Properties

### name

> **name**: `string`

Defined in: [types/index.ts:29](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/types/index.ts#L29)

***

### description

> **description**: `string`

Defined in: [types/index.ts:30](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/types/index.ts#L30)

***

### severity

> **severity**: [`Severity`](../type-aliases/Severity.md)

Defined in: [types/index.ts:31](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/types/index.ts#L31)

## Methods

### check()

> **check**(`document`, `context`): [`LintMessage`](LintMessage.md)[]

Defined in: [types/index.ts:32](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/types/index.ts#L32)

#### Parameters

##### document

`any`

##### context

[`LintContext`](LintContext.md)

#### Returns

[`LintMessage`](LintMessage.md)[]
