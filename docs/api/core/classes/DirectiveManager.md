[**@testthedocs/core**](../README.md)

***

[@testthedocs/core](../README.md) / DirectiveManager

# Class: DirectiveManager

Defined in: [directive-manager.ts:19](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L19)

## Constructors

### Constructor

> **new DirectiveManager**(`validRules`): `DirectiveManager`

Defined in: [directive-manager.ts:27](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L27)

#### Parameters

##### validRules

`string`[]

#### Returns

`DirectiveManager`

## Methods

### parseDirectives()

> **parseDirectives**(`lines`, `contentHash?`): [`LintMessage`](../interfaces/LintMessage.md)[]

Defined in: [directive-manager.ts:35](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L35)

Parse directives from source lines with caching based on content hash

#### Parameters

##### lines

`string`[]

##### contentHash?

`string`

#### Returns

[`LintMessage`](../interfaces/LintMessage.md)[]

***

### isRuleDisabled()

> **isRuleDisabled**(`ruleName`, `lineNumber`): `boolean`

Defined in: [directive-manager.ts:226](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L226)

Check if a rule is disabled for a specific line

#### Parameters

##### ruleName

`string`

##### lineNumber

`number`

#### Returns

`boolean`

***

### isDirectiveLine()

> **isDirectiveLine**(`lineNumber`): `boolean`

Defined in: [directive-manager.ts:244](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L244)

Check if a line is a directive line (should be excluded from rule checking)

#### Parameters

##### lineNumber

`number`

#### Returns

`boolean`

***

### getDirectiveLines()

> **getDirectiveLines**(): `number`[]

Defined in: [directive-manager.ts:251](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L251)

Get all directive lines for debugging

#### Returns

`number`[]

***

### clearCache()

> `static` **clearCache**(): `void`

Defined in: [directive-manager.ts:258](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L258)

Clear cache - useful for testing or when rules change

#### Returns

`void`

***

### generateContentHash()

> `static` **generateContentHash**(`content`): `string`

Defined in: [directive-manager.ts:266](https://github.com/ocular-d/asciidoclint/blob/main/packages/core/src/directive-manager.ts#L266)

Generate content hash for caching

#### Parameters

##### content

`string`

#### Returns

`string`
