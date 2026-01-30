[**@testthedocs/core**](../README.md)

***

[@testthedocs/core](../README.md) / AsciiDocLinter

# Class: AsciiDocLinter

Defined in: [index.ts:8](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L8)

## Constructors

### Constructor

> **new AsciiDocLinter**(`config`): `AsciiDocLinter`

Defined in: [index.ts:14](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L14)

#### Parameters

##### config

[`LintConfig`](../interfaces/LintConfig.md) = `...`

#### Returns

`AsciiDocLinter`

## Methods

### addRule()

> **addRule**(`rule`): `void`

Defined in: [index.ts:25](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L25)

#### Parameters

##### rule

[`LintRule`](../interfaces/LintRule.md)

#### Returns

`void`

***

### removeRule()

> **removeRule**(`ruleName`): `void`

Defined in: [index.ts:31](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L31)

#### Parameters

##### ruleName

`string`

#### Returns

`void`

***

### lintText()

> **lintText**(`content`, `filename?`): [`LintResult`](../interfaces/LintResult.md)

Defined in: [index.ts:37](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L37)

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

Defined in: [index.ts:141](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/index.ts#L141)

#### Parameters

##### filepath

`string`

#### Returns

`Promise`\<[`LintResult`](../interfaces/LintResult.md)\>
