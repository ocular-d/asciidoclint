export type Issue = {
ruleId: string;
message: string;
line: number;
column?: number;
};


export type Rule = {
id: string;
description?: string;
/**
* Check the file content and return issues.
* `path` may be undefined for stdin or virtual files.
*/
check(content: string, config: any, path?: string): Promise<Issue[]> | Issue[];
};