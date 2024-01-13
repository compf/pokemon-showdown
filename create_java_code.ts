import { Moves } from "./data/moves";
import {MovesText} from "./data/text/moves"
import {Items} from "./data/items"
import {ItemsText} from "./data/text/items"
import {Abilities} from "./data/abilities"
import {AbilitiesText} from "./data/text/abilities"
import fs from "fs"
const effect_type=process.argv[2]

function make_valid_identifier(name:string):string{
    name= name.replace(/ /g,"_").replace(/-/g,"_").replace(/\(/g,"_").replace(/\)/g,"_").replace(/'/g,"_")
    name=name.replace(/,/g,"_").replace(/\./g,"_")
    if(name.startsWith("1")){
        name="_"+name;
    }
    
    return name
}
function give_parameters_typing(content:string):string{
    const look_ahead=/(?=(,|\())/
    content=content.replace(/target(?=(,|\())/,`Pokemon target`).replace(/pokemonv/,`Pokemon pokemon`);
    content=content.replace(/move(?=(,|\())/,`Move move`).replace(/damage(?=(,|\())/,`DamageInformation damage`);
    content=content.replace(/source(?=(,|\())/,`Pokemon source`);
    return content;
}
function build_java_code(name:string,description:string,overridenFunctions:{[key:string]:string}){
    let packageDecl="package compf.core.engine.pokemon.effects.newEffects."+effect_type+";\n";
    let className=name;
    let imports=`import compf.core.engine.BattleAction;
    import compf.core.engine.pokemon.PokemonStat;
    import compf.core.engine.pokemon.Pokemon;
    import compf.core.engine.pokemon.effects.EffectParam;
    import compf.core.engine.pokemon.effects.PokemonBattleEffect;
    import compf.core.engine.pokemon.moves.DamageInformation;
    import compf.core.engine.pokemon.moves.Schedule;
    import compf.core.engine.pokemon.moves.Schedule.ScheduleItem;
    import compf.core.etc.services.SharedInformation;`
    let classHeader="/*"+description+"*/\n"+" public class " +className+" extends PokemonBattleEffect{\n"
    let classBody=""
    for(let key in overridenFunctions){
        let method=give_parameters_typing(overridenFunctions[key])
        method="@Override\n void "+method;
        classBody+="/*"+method+"*/\n"

    }
    let constructor=`public `+className+`(Pokemon pkmn) {
        super(pkmn);
    }`
    classBody+=constructor;
    let result=packageDecl+"\n"+imports+"\n"+classHeader+"\n"+classBody+"\n"+"}"
    fs.writeFileSync("../../core/src/main/java/compf/core/engine/pokemon/effects/newEffects/"+effect_type+"/"+className+".java",result)
   
    
}
function get_indexers_by_kind(){
    switch(effect_type){
        case "moves":
            return {main:Moves,text:MovesText};
        case "abilities":
            return {main:Abilities,text:AbilitiesText};
        case "items":
            return {main:Items,text:ItemsText};
        default:
            throw "unknown effect type";
    }
}
function create_factory(all_moves_with_effects:string[]){
    const packageDecl="package compf.core.engine.pokemon.effects;";
    const importStatements=" import compf.core.engine.pokemon.effects.PokemonBattleEffect;\n import compf.core.engine.pokemon.Pokemon;"
    let className=effect_type.charAt(0).toUpperCase() + effect_type.slice(1)+"EffectFactory";
    let classHeader="public class "+className+"{\n";
    let methodHeader="public static PokemonBattleEffect getEffect(String effectName,Pokemon pkmn){\n";
    let methodBody="switch(effectName){\n";
    for(let move of all_moves_with_effects){
        methodBody+="case \""+move+"\":\n";
        let valid_identifier=make_valid_identifier(move);
        methodBody+="return new compf.core.engine.pokemon.effects.newEffects."+effect_type+"."+valid_identifier+"(pkmn);\n";
    }
    methodBody+="default:\n";
    methodBody+="return null;\n";
    let content=packageDecl+"\n"+importStatements+"\n"+classHeader+"\n"+methodHeader+"\n"+methodBody+"\n"+"}\n"+"}\n}";
    fs.writeFileSync("../../core/src/main/java/compf/core/engine/pokemon/effects/"+className+".java",content);
    console.log(content);
}

let indexers=get_indexers_by_kind();
let descriptions=indexers.text;
let objects = indexers.main;
let allNonEmptyClasses=[]
for (let key in objects) {
    console.log(key)
    let object = objects[key];
    let map={}
    for (let field in object) {
        if (typeof (object[field]) == "function") {
            map[field]=object[field].toString();
           let content= object[field].toString();
        }
        else if(field=="condition"){
            for(let condition in object[field]){
               map[condition]=object[field][condition].toString();
            }
        }
    }
    if(Object.keys(map).length>0){
        allNonEmptyClasses.push(object["name"]);
        let desc=descriptions[key]==undefined ? "":descriptions[key].desc;
        build_java_code(make_valid_identifier(object["name"]),desc,map)
    }
    
}
create_factory(allNonEmptyClasses);


