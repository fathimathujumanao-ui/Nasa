const $ = (id) => document.getElementById(id);
const state = { power: "solar", priority: "balanced", eventIndex: 0, eventResolved: false, eventEffects: { budget: 0, power: 0, risk: 0, science: 0 }, history: [] };
const equipment = { camera: {name:"High-resolution camera",cost:35,power:8,science:17,risk:-2}, radar:{name:"Subsurface radar",cost:55,power:13,science:20,risk:3}, lab:{name:"Sample analysis lab",cost:80,power:18,science:28,risk:4}, nav:{name:"Autonomous navigation",cost:40,power:7,science:8,risk:-10} };
const events = [
 {title:"Solar dust storm detected",desc:"A dust storm is reducing solar-array output. Choose how mission control should respond.",sol:"SOL 087",choices:[{label:"Enter low-power safe mode",effect:"Protects equipment, but pauses some science activities.",budget:0,power:8,risk:-12,science:-4},{label:"Continue science operations",effect:"Keeps instruments running, but raises operational risk.",budget:0,power:-14,risk:12,science:8},{label:"Use reserve power and reroute",effect:"Maintains most science activity at a modest cost.",budget:12,power:-5,risk:-4,science:4}]},
 {title:"Navigation computer warning",desc:"The navigation system reports a sensor anomaly near a rocky region.",sol:"SOL 124",choices:[{label:"Take the safer long route",effect:"Adds travel time but significantly reduces terrain risk.",budget:8,power:-4,risk:-15,science:0},{label:"Run autonomous diagnostics",effect:"Uses computing power to check the fault before proceeding.",budget:3,power:-7,risk:-7,science:2},{label:"Proceed on planned route",effect:"Saves resources now, but accepts more uncertainty.",budget:0,power:2,risk:13,science:3}]},
 {title:"Unexpected water-ice signal",desc:"Radar data suggests a promising subsurface ice deposit. Decide how to investigate.",sol:"SOL 166",choices:[{label:"Deploy the full instrument suite",effect:"Potentially valuable science return, with extra power demand.",budget:10,power:-12,risk:5,science:15},{label:"Collect remote measurements first",effect:"A cautious survey improves confidence at low risk.",budget:4,power:-4,risk:-3,science:8},{label:"Skip the site and continue",effect:"Preserves resources but misses a possible discovery.",budget:0,power:5,risk:-2,science:-8}]},
 {title:"Communications blackout",desc:"A planned communications window is missed. Mission control must decide what to do next.",sol:"SOL 203",choices:[{label:"Wait for the next window",effect:"Conserves energy and follows a conservative protocol.",budget:0,power:3,risk:-6,science:-2},{label:"Use the high-gain antenna",effect:"Consumes extra energy but attempts to restore contact quickly.",budget:5,power:-8,risk:-2,science:1},{label:"Continue autonomous operations",effect:"Keeps work moving, but relies on onboard decisions.",budget:0,power:-3,risk:8,science:5}]},
 {title:"Instrument temperature rising",desc:"One science instrument is approaching its operating temperature limit.",sol:"SOL 248",choices:[{label:"Pause the instrument for cooling",effect:"Protects the instrument with a short science delay.",budget:0,power:4,risk:-12,science:-3},{label:"Rebalance thermal and power loads",effect:"A small adjustment maintains a stable operating profile.",budget:6,power:-2,risk:-7,science:2},{label:"Keep collecting data",effect:"Maximises short-term data but raises equipment risk.",budget:0,power:-6,risk:14,science:7}]}
];
const facts = [
 {value:"225M km",title:"Average Mars distance",desc:"Mars is about 225 million kilometres from Earth on average; the actual distance changes along the orbits."},
 {value:"24h 37m",title:"Length of a Martian day",desc:"A Martian solar day, called a sol, is a little longer than an Earth day."},
 {value:"−63°C",title:"Average surface temperature",desc:"Mars is cold on average, with substantial temperature changes by location, season, and time."},
 {value:"0.38 g",title:"Surface gravity",desc:"Gravity on Mars is about 38% of Earth's surface gravity."}
];
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function money(n){return "$"+Math.round(n)+"M"}
function getConfig(){
 const duration=Number($("duration").value);
 const enabled=[...document.querySelectorAll("[data-equip]:checked")].map(x=>x.dataset.equip);
 const launch=$("launchVehicle")?.value||"medium";
 const destination=$("destination")?.value||"surface";
 const communications=$("communications")?.value||"relay";
 const orbit=$("orbit")?.value||"polar";
 const launchData={light:{name:"Light lift",capacity:2000,cost:80},medium:{name:"Medium lift",capacity:8000,cost:150},heavy:{name:"Heavy lift",capacity:15000,cost:260}}[launch];
 const destData={orbit:{mass:350,cost:20,science:5,risk:-3,name:"Mars orbital survey"},surface:{mass:900,cost:55,science:12,risk:5,name:"Mars surface rover"},sample:{mass:2100,cost:180,science:25,risk:18,name:"Sample-return concept"}}[destination];
 const commData={basic:{mass:35,cost:12,coverage:58,risk:8,name:"Basic direct-to-Earth"},relay:{mass:140,cost:65,coverage:91,risk:-7,name:"Relay orbiter + direct-to-Earth"},highgain:{mass:75,cost:35,coverage:76,risk:0,name:"High-gain direct-to-Earth"}}[communications];
 const orbitData={low:{mass:0,cost:0,science:2,risk:1,name:"Low Mars orbit"},polar:{mass:30,cost:15,science:8,risk:0,name:"Polar science orbit"},surface:{mass:60,cost:22,science:4,risk:4,name:"Surface operations"}}[orbit];
 const instrumentMass={camera:45,radar:90,lab:135,nav:55};
 const payloadMass=enabled.reduce((s,k)=>s+(instrumentMass[k]||0),0);
 const busMass=420+destData.mass+commData.mass+orbitData.mass;
 const mass=Math.round(busMass+payloadMass);
 const cost=240+launchData.cost+(state.power==="solar"?45:90)+enabled.reduce((s,k)=>s+equipment[k].cost,0)+Math.max(0,duration-12)*2+destData.cost+commData.cost+orbitData.cost+state.eventEffects.budget;
 let power=state.power==="solar"?79:96;
 power-=Math.max(0,duration-12)*1.2;
 power-=enabled.reduce((s,k)=>s+equipment[k].power,0)*.55;
 power+=state.eventEffects.power;
 if(communications==="relay")power-=3;
 power=clamp(Math.round(power),3,100);
 let science=48+enabled.reduce((s,k)=>s+equipment[k].science,0)+(state.priority==="science"?12:state.priority==="safety"?-5:4)-Math.max(0,duration-18)*.4+destData.science+orbitData.science+state.eventEffects.science;
 science=clamp(Math.round(science),5,100);
 let risk=29+(state.power==="solar"?10:0)+Math.max(0,duration-12)*.8+enabled.reduce((s,k)=>s+equipment[k].risk,0)+(state.priority==="safety"?-13:state.priority==="science"?8:0)+destData.risk+commData.risk+orbitData.risk+state.eventEffects.risk;
 if(!enabled.includes("nav"))risk+=15;
 if(power<30)risk+=16;
 if(cost>650)risk+=8;
 const fit=mass<=launchData.capacity;
 if(!fit)risk+=20;
 risk=clamp(Math.round(risk),5,95);
 let readiness=clamp(Math.round(100-risk*.38+power*.18+science*.18-(cost>650?8:0)),20,99);
 if(state.priority==="safety")readiness=clamp(readiness+4,20,99);
 if(!fit)readiness=clamp(readiness-18,10,99);
 return {name:$("missionName").value.trim()||"Untitled Mission",duration,enabled,cost:Math.round(cost),power,science,risk,readiness,launch,destination,communications,orbit,mass,capacity:launchData.capacity,launchName:launchData.name,destinationName:destData.name,commName:commData.name,commCoverage:commData.coverage,orbitName:orbitData.name,fit};
}
function diagnosis(c){
 const items=[];
 items.push({icon:c.power>55?"✓":"⚠",title:c.power>55?"Power reserve looks healthy":"Power reserve needs attention",desc:c.power>55?"Current power assumptions leave a reasonable operational buffer.":"Reduce instrument load, shorten mission duration, or select nuclear power."});
 items.push({icon:c.risk<35?"✓":"⚠",title:c.risk<35?"Operational risk is controlled":"Operational risk is elevated",desc:c.risk<35?"Navigation and safety choices support a more resilient mission.":"Consider autonomous navigation, safety-first priority, or a safer contingency response."});
 items.push({icon:c.science>=70?"✦":"↗",title:c.science>=70?"Strong science potential":"Science return can be improved",desc:c.science>=70?"Selected instruments offer useful research opportunities.":"Add the camera, radar, or sample lab if the budget and power allow."});
 return items;
}
function render(){
 const c=getConfig();
 if($("massValue")){
  $("massValue").textContent=c.mass.toLocaleString()+" kg";
  $("massDetail").textContent="Estimated spacecraft + instruments";
  $("capacityValue").textContent=c.capacity.toLocaleString()+" kg";
  $("capacityDetail").textContent=c.launchName+" capacity (illustrative)";
  $("commValue").textContent=c.commCoverage+"%";
  $("commDetail").textContent=c.commName;
  $("fitValue").textContent=c.fit?"WITHIN LIMIT":"OVER LIMIT";
  $("fitValue").style.color=c.fit?"var(--green)":"var(--red)";
  $("fitDetail").textContent=c.fit?"Mass fits selected launch capacity":"Reduce mass or choose a higher-capacity launch option";
  const warnings=[];
  if(!c.fit) warnings.push("⚠ Payload mass exceeds the selected launch capacity. Choose a higher-capacity option or remove equipment / change mission profile.");
  if(c.power<35) warnings.push("⚠ Low modeled power reserve: reduce the equipment load, shorten the mission, or select RTG-style power.");
  if(c.cost>650) warnings.push("⚠ Estimated cost is above the suggested educational planning target.");
  if(c.commCoverage<70) warnings.push("⚠ Communications coverage is limited in this simplified model; consider relay support.");
  $("engineeringWarnings").innerHTML=warnings.length?warnings.map(w=>`<div class="warning-item">${w}</div>`).join(""):'<div class="success-item">✓ No major constraint warnings in this simplified model.</div>';
 }
 $("heroScore").textContent=c.readiness+"/100";$("heroBudget").textContent=money(c.cost);$("heroPower").textContent=c.power+"%";
 $("budgetStat").textContent=money(c.cost);$("budgetBar").style.width=clamp(c.cost/800*100,0,100)+"%";$("budgetHint").textContent=c.cost>600?"Above recommended planning target":"Illustrative total mission cost";
 $("powerStat").textContent=c.power+"%";$("powerBar").style.width=c.power+"%";
 $("riskStat").textContent=c.risk<30?"LOW":c.risk<55?"MODERATE":"HIGH";$("riskBar").style.width=c.risk+"%";
 $("scienceStat").textContent=c.science+"/100";$("scienceBar").style.width=c.science+"%";
 $("durationValue").textContent=c.duration;
 $("readinessValue").textContent=c.readiness;$("readinessRing").style.background=`conic-gradient(var(--cyan) ${c.readiness*3.6}deg,#26344d ${c.readiness*3.6}deg)`;
 $("readinessLabel").textContent=c.readiness>=80?"Mission strong":c.readiness>=65?"Mission viable":"Needs redesign";
 $("readinessDesc").textContent=c.readiness>=80?"Your current design has a promising balance of readiness, science, and resources.":c.readiness>=65?"Your design can work in this simplified model, with trade-offs to review.":"Address power, risk, or cost before considering this design ready.";
 $("diagnosisList").innerHTML=diagnosis(c).map(d=>`<div class="diagnosis"><span class="diagnosis-icon">${d.icon}</span><div><b>${d.title}</b><p>${d.desc}</p></div></div>`).join("");
 let suggestion=!c.fit?"The modeled spacecraft is too heavy for the selected launch option. Choose a larger capacity or reduce the equipment / mission mass.":c.power<35?"Reduce instrument load or choose the RTG nuclear power system to increase the modeled reserve.":c.risk>50?"Enable autonomous navigation and consider Safety first to reduce the modeled risk.":c.cost>600?"Review the instrument list and mission duration to keep estimated costs under control.":c.science<70?"Add the sample analysis lab or set the priority to Science first to raise expected research value.":"The design is balanced. Run a mission event to test how well it handles unexpected conditions.";
 $("suggestionText").textContent=suggestion;
 $("designAName").textContent=c.name;$("compareAReadiness").textContent=c.readiness+"/100";$("compareACost").textContent=money(c.cost);$("compareAScience").textContent=c.science+"/100";$("compareARisk").textContent=c.risk+"/100";
 const b={cost:Math.round(240+90+35+55+40+36),power:78,science:82,risk:27,readiness:84};
 $("compareBReadiness").textContent=b.readiness+"/100";$("compareBCost").textContent=money(b.cost);$("compareBScience").textContent=b.science+"/100";$("compareBRisk").textContent=b.risk+"/100";
 const winner=c.readiness>b.readiness?"Design A leads on readiness in this model.":c.readiness<b.readiness?"Design B currently has higher modeled readiness.":"Both designs have similar modeled readiness.";
 $("compareVerdict").textContent=winner+" Design A reflects your choices; Design B is a fixed robust alternative. All estimates are illustrative, not real engineering predictions.";
 return c;
}
function renderEvent(){
 const e=events[state.eventIndex%events.length];state.eventResolved=false;
 $("eventTitle").textContent=e.title;$("eventDescription").textContent=e.desc;$("eventSol").textContent=e.sol;
 $("eventOutcome").hidden=true;$("eventOutcome").textContent="";
 $("eventChoices").innerHTML=e.choices.map((ch,i)=>`<button class="event-choice" data-event-choice="${i}" type="button"><span>${ch.label}</span><small>${ch.budget>=0?"+":""}${ch.budget}M · ${ch.power>=0?"+":""}${ch.power}% power</small></button>`).join("");
 $("eventChoices").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>resolveEvent(Number(btn.dataset.eventChoice))));
}
function resolveEvent(i){
 if(state.eventResolved)return;
 const e=events[state.eventIndex%events.length],ch=e.choices[i];state.eventResolved=true;
 state.eventEffects.budget+=ch.budget;state.eventEffects.power+=ch.power;state.eventEffects.risk+=ch.risk;state.eventEffects.science+=ch.science;
 state.history.push({event:e.title,choice:ch.label,effect:ch.effect});
 $("eventOutcome").hidden=false;$("eventOutcome").textContent="Decision recorded: "+ch.effect+" The mission model has been updated.";
 $("eventChoices").querySelectorAll("button").forEach((b,j)=>{b.disabled=true;if(j===i)b.style.borderColor="var(--green)";});
 render();toast("Mission decision recorded");
}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2400)}
function runSimulation(){
 const c=render();
 const chance=clamp(Math.round(c.readiness*.7+(100-c.risk)*.2+c.power*.1),10,99);
 let result=chance>=80?"MISSION OBJECTIVES LIKELY ACHIEVED":chance>=62?"PARTIAL SUCCESS — REVIEW RISKS":"MISSION AT RISK — REDESIGN ADVISED";
 const summary=`Simulation complete for ${c.name}. Readiness ${c.readiness}/100; modeled success likelihood ${chance}%; power reserve ${c.power}%; risk index ${c.risk}/100. Result: ${result}. This is a simplified educational estimate, not a real-world flight prediction.`;
 state.history.push({event:"Mission simulation",choice:result,effect:summary});
 toast(result);
 $("readinessDesc").textContent=`${result}. Modeled likelihood: ${chance}%. These are illustrative educational estimates.`;
}
function exportReport(){
 const c=render();
 const lines=[
 "ORBITWISE: MISSION ARCHITECT — MISSION REPORT","Generated: "+new Date().toLocaleString(),"",
 "MISSION CONFIGURATION","Mission name: "+c.name,"Duration: "+c.duration+" months","Destination: "+c.destinationName,"Orbit / operations profile: "+c.orbitName,"Launch vehicle: "+c.launchName,"Estimated spacecraft mass: "+c.mass+" kg","Illustrative launch capacity: "+c.capacity+" kg","Launch fit: "+(c.fit?"Within modeled limit":"Over modeled limit"),"Communications: "+c.commName+" ("+c.commCoverage+"% illustrative coverage)","Power system: "+(state.power==="solar"?"Solar array":"RTG nuclear"),"Priority: "+state.priority,"Equipment: "+(c.enabled.length?c.enabled.map(k=>equipment[k].name).join(", "):"None selected"),"",
 "ILLUSTRATIVE MODEL RESULTS","Estimated cost: "+money(c.cost),"Power reserve: "+c.power+"%","Science return: "+c.science+"/100","Risk index: "+c.risk+"/100","Readiness: "+c.readiness+"/100","",
 "MISSION DECISION LOG",...(state.history.length?state.history.map((h,i)=>`${i+1}. ${h.event} — ${h.choice}. ${h.effect}`):["No events or simulations recorded."]),"",
 "ENGINEERING CONSTRAINTS","Selected destination: "+c.destinationName,"Launch capacity check: "+(c.fit?"PASS (illustrative)":"WARNING: OVER CAPACITY (illustrative)"),"Communications coverage is a simplified teaching indicator, not a link-budget calculation.","","IMPORTANT LIMITATION","ORBITWISE is an educational planning simulation. Cost, power, readiness, risk, science, and success-likelihood values are simplified illustrative estimates and must not be used for real mission engineering.","","MARS REFERENCE FACTS","A Martian sol is about 24 hours 37 minutes. Mars surface gravity is about 0.38 g. Average surface temperature is approximately -63°C. Mars is about 225 million km from Earth on average."
 ];
 const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="ORBITWISE_Mission_Report.txt";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast("Mission report exported");
}
function reset(){
 state.power="solar";state.priority="balanced";state.eventIndex=0;state.eventResolved=false;state.eventEffects={budget:0,power:0,risk:0,science:0};state.history=[];
 $("missionName").value="Ares Pathfinder";$("duration").value=18;
 if($("launchVehicle"))$("launchVehicle").value="medium";if($("destination"))$("destination").value="surface";if($("communications"))$("communications").value="relay";if($("orbit"))$("orbit").value="polar";
 document.querySelectorAll("[data-equip]").forEach(el=>el.checked=["camera","radar","nav"].includes(el.dataset.equip));
 document.querySelectorAll("[data-power]").forEach(el=>el.classList.toggle("selected",el.dataset.power==="solar"));
 document.querySelectorAll("[data-priority]").forEach(el=>el.classList.toggle("selected",el.dataset.priority==="balanced"));
 renderEvent();render();toast("Mission reset to default");
}
document.querySelectorAll("[data-power]").forEach(btn=>btn.addEventListener("click",()=>{state.power=btn.dataset.power;document.querySelectorAll("[data-power]").forEach(b=>b.classList.toggle("selected",b===btn));render()}));
document.querySelectorAll("[data-priority]").forEach(btn=>btn.addEventListener("click",()=>{state.priority=btn.dataset.priority;document.querySelectorAll("[data-priority]").forEach(b=>b.classList.toggle("selected",b===btn));render()}));
document.querySelectorAll("[data-equip]").forEach(el=>el.addEventListener("change",render));
$("missionName").addEventListener("input",render);$("duration").addEventListener("input",render);
["launchVehicle","destination","communications","orbit"].forEach(id=>$(id).addEventListener("change",render));
$("simulateBtn").addEventListener("click",runSimulation);$("reportBtn").addEventListener("click",exportReport);$("resetBtn").addEventListener("click",reset);
$("nextEventBtn").addEventListener("click",()=>{state.eventIndex=(state.eventIndex+1)%events.length;renderEvent();toast("New mission event loaded")});
$("factsGrid").innerHTML=facts.map(f=>`<article class="fact"><strong>${f.value}</strong><b>${f.title}</b><p>${f.desc}</p></article>`).join("");
renderEvent();render();
