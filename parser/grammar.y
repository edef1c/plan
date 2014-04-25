/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

[0-9]+("."[0-9]+)?\b  return 'LITERAL'
\"(?:[^"\\]*|\\["\\bfnrt\/]|\\u[0-9a-f]{4})*\" return 'LITERAL'
[^\s()\[\]"'.][^\s()\[\]".]*  return 'IDENTIFIER'
"'"                   return "'"
"("                   return '('
"["                   return '['
"."                   return '.'
"]"                   return ']'
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
    | vector
        {$$ = $1}
    | "'" e
        {$$ = yy.list(yy.symbol('quote'), $2)}
    | LITERAL
        {$$ = JSON.parse(yytext)}
    | IDENTIFIER
        {$$ = yy.symbol(yytext)}
    ;
es
    :
        {$$ = null}
    | '.' e
        {$$ = $2}
    | e es
        {$$ = yy.cons($1, $2)}
    ;

list
    : '(' es ')'
        {$$ = $2}
    ;

vector
    : '[' es ']'
        {$$ = yy.apply(yy.vector, $2)}
    ;
