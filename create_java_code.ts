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
let indexers=get_indexers_by_kind();
let moveDesc=indexers.text;
let moves = indexers.main;
for (let key in moves) {
    console.log(key)
    let move = moves[key];
    let map={}
    for (let field in move) {
        if (typeof (move[field]) == "function") {
            map[field]=move[field].toString();
           let content= move[field].toString();
        }
        else if(field=="condition"){
            for(let condition in move[field]){
               map[condition]=move[field][condition].toString();
            }
        }
    }
    if(Object.keys(map).length>0){
        let desc=moveDesc[key]==undefined ? "":moveDesc[key].desc;
        build_java_code(make_valid_identifier(move["name"]),desc,map)
    }
    
}


