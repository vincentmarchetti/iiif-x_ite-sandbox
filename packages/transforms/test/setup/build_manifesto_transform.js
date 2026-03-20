import * as manifesto from  "@kshell/manifesto-prezi4";



export function T(xv,yv,zv){
    const jsonld = {
        "type" : "TranslateTransform",
        "x"    : xv,
        "y"    : yv,
        "z"    : zv
    };
    const u =  new manifesto.TranslateTransform(jsonld);
    u.label = "T";
    
    
    u.toString = function(){
        return `T(${xv} , ${yv}, ${zv})`;
    };
   
    return u;
};

export function R(xv,yv,zv){
    const jsonld = {
        "type" : "RotateTransform",
        "x"    : xv,
        "y"    : yv,
        "z"    : zv
    };
    const u =  new manifesto.RotateTransform(jsonld);
    u.label = "R";
    
    u.toString = function(){
        return `R(${xv} , ${yv}, ${zv})`;
    };

    return u;
};

export  function S(xv,yv,zv){
    const jsonld = {
        "type" : "ScaleTransform",
        "x"    : xv,
        "y"    : yv,
        "z"    : zv
    };
    const u =  new manifesto.ScaleTransform(jsonld);
    u.label = "S";
    u.toString = function(){
        return `S(${xv} , ${yv}, ${zv})`;
    };
    return u;
};

//module.exports = {S,R,T, Vector3};
