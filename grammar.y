/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
\"(?:{esc}["bfnrt/{esc}]|{esc}"u"[a-fA-F0-9]{4}|[^"{esc}])*\" yytext = yytext.substr(1,yyleng-2); return 'STRING'
[^\s()]+              return 'IDENTIFIER'
"("                   return '('
")"                   return ')'
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
    | IDENTIFIER
        {$$ = yy.Identifier.of(yytext)}
    | STRING
        {$$ = String(yytext)}
    | NUMBER
        {$$ = Number(yytext)}
    ;
es
    :
        {$$ = []}
    | e es
        {$$ = [$1].concat($2)}
    ;

list
    : '(' es ')'
        {$$ = $2}
    ;
