/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

[0-9]+("."[0-9]+)?\b  return 'LITERAL'
\"(?:[^"\\]*|\\["\\bfnrt\/]|\\u[0-9a-f]{4})*\" return 'LITERAL'
[^\s()"'.][^\s()".]*  return 'IDENTIFIER'
"'"                   return "'"
"("                   return '('
"."                   return '.'
")"                   return ')'
\s+                   /* skip whitespace */
<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%start program

%% /* language grammar */

program
    : es EOF
        {return $1}
    ;

e
    : list
        {$$ = $1}
    | "'" e
        {$$ = yy.Cons.from([yy.Identifier.of('quote'), $2])}
    | LITERAL
        {$$ = JSON.parse(yytext)}
    | IDENTIFIER
        {$$ = yy.Identifier.of(yytext)}
    ;
es
    :
        {$$ = null}
    | '.' e
        {$$ = $2}
    | e es
        {$$ = yy.Cons.of($1, $2)}
    ;

list
    : '(' es ')'
        {$$ = $2}
    ;
