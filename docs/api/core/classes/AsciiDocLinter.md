[**@testthedocs/core**](../README.md)

***

[@testthedocs/core](../README.md) / AsciiDocLinter

# Class: AsciiDocLinter

Defined in: [index.ts:8](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L8)

## Constructors

### Constructor

> **new AsciiDocLinter**(`config`): `AsciiDocLinter`

Defined in: [index.ts:13](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L13)

#### Parameters

##### config

[`LintConfig`](../interfaces/LintConfig.md) = `...`

#### Returns

`AsciiDocLinter`

## Methods

### addRule()

> **addRule**(`rule`): `void`

Defined in: [index.ts:23](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L23)

#### Parameters

##### rule

[`LintRule`](../interfaces/LintRule.md)

#### Returns

`void`

***

### removeRule()

> **removeRule**(`ruleName`): `void`

Defined in: [index.ts:28](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L28)

#### Parameters

##### ruleName

`string`

#### Returns

`void`

***

### lintText()

> **lintText**(`content`, `filename?`): [`LintResult`](../interfaces/LintResult.md)

Defined in: [index.ts:33](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L33)

#### Parameters

##### content

`string`

##### filename?

`string`

#### Returns

[`LintResult`](../interfaces/LintResult.md)

***

### lintFile()

> **lintFile**(`filepath`): `Promise`\<[`LintResult`](../interfaces/LintResult.md)\>

Defined in: [index.ts:132](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L132)

#### Parameters

##### filepath

`string`

#### Returns

`Promise`\<[`LintResult`](../interfaces/LintResult.md)\>
