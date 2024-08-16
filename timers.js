// ==UserScript==
// @name         SuperTurtleIdle CD Tracker
// @version      0.44.4
// @description  Togglable cooldown tracker for Jester, Mystery Present, gift for petting turtle, gift for exporting, item of the day restock, and dungeons)
// @match        https://superturtleidle.github.io/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/gorakr/SuperTurtleIdle-CD-Tracker/main/timers.js
// ==/UserScript==
//
// Original idea from @yawa on Super Turtle Idle Discord
//
// HOW TO USE:````
// Install a UserScript manager extension such as TamperMonkey (google it) and set to run on page visit
//
// the first value for a timer can be set to 1 or 0 on the cd_timers object to enable or disable individual timers you want to see
//
// water timer shows the % value remaining on least watered plant available plant the border is yellow if you have at least 1 empty plot, red if all plots are empty
// dungeons borders are colored per remaining charge green at 3, yellow at 2, red at 1, and black again when you have no charges left
//
// if you unlock a new feature that is trackable and enabled it will appear on page refresh (remember to save your game!)
(function() {
    'use strict';
    let cd_timers = {"cdt_jester":[true,'/img/sys/jesterturtle.png','jesterCooldown',cd],
                     "cdt_mystery":[1,'/img/src/enemies/E15M.png','presentCanSpawn',cd],
                     "cdt_gilded":[1,'/img/src/mejoras/bu3.png','gildedCooldown',cd],
                     "cdt_water":[1,'img/src/garden/g2.png'],
                     "cdt_research":[1,'/img/src/icons/researchIcon.jpg'],
                     "cdt_turtlepet":[1,'/img/src/items/I119.jpg','presentCooldown',cd],
                     "cdt_export":[1,'/img/src/items/I296.jpg','exportReminder',cd],
                     "cdt_iotd":[1,'/img/src/items/I218.jpg','itemOfTheDay',cd],
                     "cdt_dungeon1":[1,'/img/src/enemies/E22M.png','A5.dungeonTimer',areas,'A5.charges',areas],
                     "cdt_dungeon2":[1,'/img/src/enemies/E24M.png','A6.dungeonTimer',areas,'A6.charges',areas],
                     "cdt_dungeon3":[1,'/img/src/enemies/E47M.png','A10.dungeonTimer',areas,'A10.charges',areas]
                     // formatting "id" (string:[enable/disable (bool),"background image url" (string),timerProp (string),timerObject (obj),chargeProp (string), chargeObject (obj)],
                    }
    let cd_sweep_max = {};
    let alternate_sweep = ['cdt_water','cdt_research']
    let cd_style =`
<style>
#cdt_container {
   position:relative;
   display: inline-flex;
   margin-right:2rem;
   }
.cdt_base {
    border-radius:.5vh;
    width: 3rem;
    height: 3rem;
    margin-right: .2rem;
    padding:2px;
}
.cdt_overlay {
    background: transparent;
    box-shadow:
    black  2px  2px 0px inset,
    black -2px -2px 0px inset;
    color: white;
    border-radius:.5vh;
    text-shadow:
    -1px -1px 0 #000,
     0   -1px 0 #000,
     1px -1px 0 #000,
     1px  0   0 #000,
     1px  1px 0 #000,
     0    1px 0 #000,
    -1px  1px 0 #000,
    -1px  0   0 #000;
    height: 100%;
    width: 3rem;
    margin-right: .2rem;
    position: absolute;
    z-index: 66;
    font-family: fredoka;
    font-size: 1.5vh;
    font-weight:400;
    display:inline-flex;
    align-items:center;
    justify-content:center;
}
.cdt_sweep {
    background: #000000c3;
    border-top-left-radius:.4vh;
    border-top-right-radius:.4vh;
    height: 0%;
    width: 2.75rem;
    margin-top: 2px;
    margin-left: 2px;
    position: absolute;
    transition: 1s all linear;
    z-index: 33;
}
</style>`;
    function formatTime(s){return s == 1 ? "" : (s < 60 ? s + "s" : (s < 3600 ? Math.floor(s / 60) + "m" : Math.floor(s / 3600) + "h"))};
    function objResolver(path, obj) {
        return path.split('.').reduce(function(prev, curr) {
            return prev ? prev[curr] : null
        }, obj || self)
    };
    let cdt_plotsUnlocked = (unlocks.garden == true ? (unlocks.gardenUpgrade1 == true ? (unlocks.gardenUpgrade2 == true ? (unlocks.gardenUpgrade3 == true ? 30 : 24) : 18) : 12) : 0)
    let widget = document.getElementsByClassName("recursosSuperior");
    let tmp = document.createElement("div");
    tmp.insertAdjacentHTML('afterbegin', `<div id="cdt_container"></div>` + cd_style);

    for(let [key, value] of Object.entries(cd_timers)) {
        if(value[0]) {
            let tmp_div = `<div id="${key}"><div id="${key}_overlay" class="cdt_overlay"></div><div id="${key}_sweep" class="cdt_sweep"></div><img id="${key}_base" src=${value[1]} class="cdt_base"></div>`;
            tmp.firstChild.innerHTML += tmp_div;
        };
    };
    widget[0].insertBefore(tmp, widget[0].firstChild);
    //hide unlockables
    if(unlocks.dungeons == false && cd_timers.cdt_dungeon1[0]){did('cdt_dungeon1').style = "display:none";}
    if(unlocks.dungeons == false && cd_timers.cdt_dungeon2[0]){did('cdt_dungeon2').style = "display:none";}
    if(unlocks.dungeons == false && cd_timers.cdt_dungeon3[0]){did('cdt_dungeon3').style = "display:none";}
    if(unlocks.itemOfTheDay == false && cd_timers.cdt_iotd[0]){did('cdt_iotd').style = "display:none";}
    if(unlocks.present == false && cd_timers.cdt_turtlepet[0]){did('cdt_turtlepet').style = "display:none";}
    if(unlocks.garden == false && cd_timers.cdt_water[0]){did('cdt_water').style = "display:none"}

    window.setInterval(function(){
        for(let [key, value] of Object.entries(cd_timers)) {
            // update default cooldown sweep
            if(value[0] && !alternate_sweep.includes(key)) {
                let cur_time = objResolver(value[2],value[3])
                if(!(key in cd_sweep_max)){
                    cd_sweep_max[key] = [cur_time,cur_time];
                };
                if (cur_time > cd_sweep_max[key][0]) {
                    cd_sweep_max[key][1] = cur_time
                };
                cd_sweep_max[key][0] = cur_time;
                let cd_per = cd_sweep_max[key][0] / cd_sweep_max[key][1] * 100;
                if (isNaN(cd_sweep_max[key][0]) || cur_time <0){ cd_per = 0};
                did(key + "_sweep").style.height = cd_per + '%'
            };
            // default timers
            if(value[0] && (cd_timers[key].length == 4)) {
                if(objResolver(value[2],value[3]) > 0){
                    did(key + "_overlay").innerText = `${formatTime(objResolver(value[2],value[3]))}`
                }else{
                }
                // dungeons with charges
            }else if(value[0] && (cd_timers[key].length == 6)) {
                if(objResolver(value[2],value[3]) > 0 && (objResolver(value[4],value[5]) != 3)){
                    did(key+"_overlay").innerText = `${formatTime(objResolver(value[2],value[3]))}`
                }else{
                }
                let s = objResolver(value[4],value[5])
                switch (s) {
                    case 0:
                        did(key + '_overlay').style.boxShadow = "black 2px  2px 0px inset,black -2px -2px 0px inset";
                        did(key + '_sweep').style.visibity = '';
                        break;
                    case 1:
                        did(key + '_overlay').style.boxShadow = "#fc4ab9a0  2px  2px 0px inset,#fc4ab9a0 -2px -2px 0px inset";
                        did(key + '_sweep').style.visibity = '';
                        break;
                    case 2:
                        did(key + '_overlay').style.boxShadow = '#efca08a0  2px  2px 0px inset,#efca08a0 -2px -2px 0px inset';
                        did(key + '_sweep').style.visibity = '';
                        break;
                    case 3:
                        did(key + '_overlay').style.boxShadow = '#68febea0  2px  2px 0px inset,#68febea0 -2px -2px 0px inset,#68febea0  -2px  2px 0px inset,#68febea0 2px -2px 0px inset';
                        did(key + '_sweep').style.visibity = 'hidden';
                        break;
                    default: did(key + '_base').style.boxShadow = 'black  2px  2px 0px inset,black -2px -2px 0px inset';
                }
            }else{
            }
        };
        //garden water timer
        if((cdt_plotsUnlocked > 0) && (cd_timers['cdt_water'][0])) {
            let i = 0;
            let garden_planted = [];
            let garden_age = [];
            for (let [key,value] of Object.entries(plot)) {
                i++
                if (i > cdt_plotsUnlocked) {break};
                if (value.age > 0) {garden_planted.push(value.water)}
                if (value.slot == "none") {garden_age.push(key)}
            };
            if(rpgPlayer.currentFertiliser != "none") {
                did('cdt_water_base').src = `/img/src/garden/${rpgPlayer.currentFertiliser}.jpg`;
            }
            if(garden_age.length == cdt_plotsUnlocked) {
                did('cdt_water_overlay').style.boxShadow = "#fc4ab9a0  2px  2px 0px inset,#fc4ab9a0 -2px -2px 0px inset";
                did('cdt_water_overlay').style.background = "#fc4ab933";
                did('cdt_water_overlay').style.fontSize = "0";
            } else if(garden_age.length > 0) {
                did('cdt_water_overlay').style.boxShadow ='#efca08a0  2px  2px 0px inset,#efca08a0 -2px -2px 0px inset';
                did('cdt_water_overlay').style.background = "";
                did('cdt_water_overlay').style.fontSize = "";
            } else {
                did('cdt_water_overlay').style.boxShadow = 'black  2px  2px 0px inset,black -2px -2px 0px inset';
                did('cdt_water_overlay').style.background = "";
                did('cdt_water_overlay').style.fontSize = "";
            };
            let w = (Math.min(...garden_planted))
            let w_per = (w <= 0 ? 0 : w == 'Infinity' ? 100 : w)
            did('cdt_water_overlay').innerText = w_per
            did('cdt_water_sweep').style.height = (w_per / 100) * 100 + '%'
        }

        // IOTD Item Icon, border for sold
        if(cd_timers.cdt_iotd[0]){
            if(itemOfTheDay.bought == false) {
                did('cdt_iotd_base').src = `/img/src/items/${itemOfTheDay.item}.jpg`;
                did('cdt_iotd_sweep').style.background = "#0000";
            } else {
                did('cdt_iotd_base').src = cd_timers.cdt_iotd[1];
                did('cdt_iotd_sweep').style.background = "";
            }
        };
        // Research module
        let reas_short = {'timer':Number.MAX_VALUE}
        for(let [k,r_obj] of Object.entries(research)){
            if(r_obj.status == "ready" || r_obj.status == "researching") {
                if (r_obj.timer < reas_short.timer) {
                    reas_short = research[k]
                }
            }
        }
        if(reas_short.timer == Number.MAX_VALUE){
            did('cdt_research').style = "display:none"
        } else {
            did('cdt_research').style = ""
            did('cdt_research_base').src = reas_short.img;
            did('cdt_research_sweep').style.height = reas_short.timer / reas_short.timerMax * 100
            did('cdt_research_overlay').innerText = (reas_short.timer == 0 ? "" : formatTime(reas_short.timer))
        }
    },1000);

})();