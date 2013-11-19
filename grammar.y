/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

[0-9]+("."[0-9]+)?\b  return 'LITERAL'
\"(?:[^"\\]*|\\["\\bfnrt\/]|\\u[0-9a-f]{4})*\" return 'LITERAL'
[^\s()"]+             return 'IDENTIFIER'
"("                   return '('
"."                   return 'CONS'
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
    | LITERAL
        {$$ = JSON.parse(yytext)}
    | IDENTIFIER
        {$$ = yy.Identifier.of(yytext)}
    ;
es
    :
        {$$ = null}
    | e es
        {$$ = yy.Cons.of($1, $2)}
    ;

list
    : '(' es ')'
        {$$ = $2}
    | '(' es CONS e ')'
        {$$ = yy.Cons.of($2, $4)}
    ;
