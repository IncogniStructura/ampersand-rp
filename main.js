//Discord initialisation
const Discord = require("discord.js");
const { prefix, token } = require('./config.json');
const client = new Discord.Client();

//Node.js imports
var fs = require('fs');

client.once('ready', () => {
	console.log("[Ampersand] is ready. Hello!");
});

client.login('Njg4OTYyMTQ1MTU2NTk1NzQz.Xm78Xg.mD75nuK-7P9KFQdwhNsmFY4lsNs');

/*

TYPES OF UNITS

Infantry
Artillery
Cavalry/Tanks
Battleships/Aircraft Carriers
Submarines/Nuclear Submarines

Fighters/Multirole Fighters
Bombers/Strategic Bombers

*/

//Bot settings
{
	bot_prefix = "$";
	start_date = new Date(2020, 03, 26, 16, 09);
	turn_timer = 60;
	announcements_channel = "549004372747747338";
	authorised_role = "";
}

government_list = ["democracy","monarchy","dictatorship","oligarchy","republic"];

var config = {
	materials: ["coal","iron","lead","gold","petrol","wood","rocks"],
	raw_materials: ["bauxite","coal","gold","iron","lead","petroleum","stone","uranium","wood","wool"],
	raw_food: ["fish","meat","vegetables","wheat"],
	processed_materials: ["clothes","concrete","food","lumber","plastics","refined_petroleum","steel","aluminium"], //Concrete is produced from stone, aluminium from bauxite.
	military_equipment: ["uniforms","small_arms","ammunition","support_equipment"], //Uniforms can be crafted from clothes
	buildings: ["mines","watermills","factories"],
	production_buildings: ["farms","fisheries","lumberjacks","mines","pastures","quarries"],
	processing_facilities: ["aluminium_factory","concrete_factory","food_processing_facilities","lumbermill","plastics_factory","refineries","steelworks","textile_mill"],
	military_processing_facilities: ["aeroplane_factories","ammunition_factories","armaments","artillery_factories","barracks","dockyards","gun_factories","tank_factories"],
	neighbourhood_buildings: ["city","financial_district","metropolis","neighbourhood","town"],
	units: ["musketmen","tpships","galleons","riflemen","cannons","ironclads","infantry","tanks","battleships","bombers","tpplanes","settlers"]
};

var def_data = {
	users: {
	}
}

let rawdata = fs.readFileSync('database.js');
let main = JSON.parse(rawdata);

function readConfig () {
	let rawconfig = fs.readFileSync('config.txt');
	eval(rawconfig.toString());
}

readConfig();

let rawhelp = fs.readFileSync('help.txt');
var help = rawhelp.toString().replace(/@/g, bot_prefix);

let rawbuildcosts = fs.readFileSync('documents/build_costs.txt');
var buildcosts = rawbuildcosts.toString();

let rawunitcosts = fs.readFileSync('documents/unit_costs.txt');
var unitcosts = rawunitcosts.toString();

let rawgovernments = fs.readFileSync('documents/governments.txt');
var governments = rawgovernments.toString();

user = "";
input = "";

building_list = [];
news = [];

//Framework
{
	//Operating functions
		
	function randomNumber(min, max) {  
		return Math.floor(Math.random() * (max - min) + min); 
	}
	
	function saveConfig () {
		var bot_settings = [
			'bot_prefix = "' + bot_prefix + '";',
			'start_date = new Date(2020, 03, 26, 16, 09);',
			'turn_timer = ' + turn_timer + ';',
			'announcements_channel = "' + announcements_channel + '";',
			'authorised_role = "' + authorised_role + '";'
		];
		fs.writeFile('config.txt', bot_settings.join("\n"), function (err,data) {
			if (err) {
				return console.log(err);
			}
			//console.log(data);
		});
	}
	
	function equalsIgnoreCase (arg0, arg1) {
		if (arg0.toLowerCase() == (bot_prefix + arg1).toLowerCase()) {
			return true;
		} else {
			return false;
		}
	}
	
	function returnMention (arg0) {
		var mention_id = arg0.replace(/(<)(@)(!)/g,"");
		mention_id = mention_id.replace(">","");
		
		return mention_id;
	}
	
	function returnChannel (arg0) {
		return client.channels.cache.get(arg0);
	}
	
	function parseMilliseconds (duration) {
		var milliseconds = parseInt((duration % 1000) / 100),
		seconds = Math.floor((duration / 1000) % 60),
		minutes = Math.floor((duration / (1000 * 60)) % 60),
		hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

		return hours + " hours, " + minutes + " minutes, " + seconds + " seconds";
	}
	
	function hasRole (arg0_msg, arg1_role) {
		if (arg0_msg.member.roles.cache.some(role => role.name === arg1_role)) {
			return true;
		} else {
			return false;
		}
	}

	function nextTurn (arg0_user) {
		var user_id = main.users[arg0_user];
		var age = main.users[arg0_user].technology_level-1;
		var buildings = main.users[arg0_user]["buildings"];
		var inventory = main.users[arg0_user]["inventory"];
		
		//News variables:
		
		var national_news = "";
		
		var famine_loss = Math.ceil(user_id.population*0.1);
		
		//Building income
		{
			//buildings: ["farms","fisheries","pastures","mines","quarries","lumberjacks","textile_mill","concrete_factory","food_processing_facilities","refineries","plastics_factory","lumbermill","steelworks","aluminium_factory","dockyards","tank_factories","artillery_factories","barracks","gun_factories","armaments","ammunition_factories","aeroplane_factories","neighbourhood","financial_district","town","city","metropolis"],
			//materials: ["bauxite","coal","gold","iron","lead","petroleum","stone","uranium","wood","wool","fish","meat","vegetables","wheat","clothes","concrete","food","lumber","plastics","refined_petroleum","steel","aluminium","uniforms","small_arms","ammunition","support_equipment"],
			
			//espionage, intelligence, troops are split between countries
			
			//Raw resource production
			{
				//Mines
				for (var i = 0; i < buildings.mines; i++) {
					user_id.actions = user_id.actions + 1;
				}
				//Watermills
				for (var i = 0; i < buildings.watermills; i++) {
					user_id.actions = user_id.actions + 2;
				}
				//Factories (3-5 actions per turn)
				for (var i = 0; i < buildings.factories; i++) {
					user_id.actions = user_id.actions + randomNumber(3, 5);
				}
				
			}
			
			//Population:
			user_id.population = Math.ceil(user_id.population*user_id.pop_growth_modifier);
			user_id.initial_manpower = Math.ceil(user_id.population*user_id.manpower_percentage);
			
			user_id.money = user_id.money + Math.ceil((user_id.actions*1000)*user_id.tax_rate);
		}
		
		//Politics
		{
			//Stability and revolt risk
			{
				var stab_tax_rate = user_id.tax_rate*100;
				var stab_party_popularity = (user_id["politics"][user_id.government]);
				var stab_government_modifier = 0;
				
				if (user_id.government != "communism" && user_id.government != "fascism" && user_id.government != "dictatorship" && user_id.government != "monarchy") {
					stab_government_modifier = 5;
				} else {
					stab_government_modifier = -5;
				}
				
				user_id.stability = Math.ceil(stab_party_popularity + stab_government_modifier - stab_tax_rate);
				
				if (user_id.stability > 100) {
					user_id.stability = 100;
				} else if (user_id.stability < 0) {
					user_id.stability = 0;
				}
				
				var dice_roll = randomNumber(0, 100);
				if (dice_roll > user_id.stability || user_id.coup_this_turn == true) {
					user_id.tax_rate = 0;
					var new_government = "";
					//Revolt
					if (user_id.government == "democracy") {
						setGovernment(user_id, "dictatorship");
						new_government = "dictatorship";
					} else if (user_id.government == "monarchy") {
						setGovernment(user_id, "oligarchy");
						new_government = "oligarchy";
					} else if (user_id.government == "dictatorship") {
						setGovernment(user_id, "monarchy");
						new_government = "monarchy";
					} else if (user_id.government == "oligarchy") {
						setGovernment(user_id, "republic");
						new_government = "republic";
					} else if (user_id.government == "republic") {
						setGovernment(user_id, "democracy");
						new_government = "democracy";
					}
					
					national_news = national_news + "The country of " + user_id.name + " fell into a state of civil unrest, allowing supporters of " + user_id.government + " to coup the government!\n";
					national_news = national_news + "Rioters then went on strike, leading the country of " + user_id.name + " to lose all their actions!\n";
					user_id.coup_this_turn = false;
					user_id.actions = 0;
				}
				
				if (user_id.overthrow_this_turn) {
					user_id.tax_rate = 0;
					var new_government = "";
					//Revolt
					if (user_id.government == "democracy") {
						setGovernment(user_id, "republic");
						new_government = "republic";
					} else if (user_id.government == "monarchy") {
						setGovernment(user_id, "dictatorship");
						new_government = "dictatorship";
					} else if (user_id.government == "dictatorship") {
						setGovernment(user_id, "democracy");
						new_government = "democracy";
					} else if (user_id.government == "oligarchy") {
						setGovernment(user_id, "monarchy");
						new_government = "monarchy";
					} else if (user_id.government == "republic") {
						setGovernment(user_id, "democracy");
						new_government = "democracy";
					}
					
					national_news = national_news + "The country of " + user_id.name + " fell into a state of civil unrest, leading supporters of " + user_id.government + " to overthrow the government!\n";
					national_news = national_news + "Rioters then went on strike, leading the country of " + user_id.name + " to lose all their actions!\n";
					user_id.overthrow_this_turn = false;
					user_id.actions = 0;
				}
			}
			
			//Civilian Actions
			{
				user_id.civilian_actions = Math.ceil(user_id.actions*user_id.civilian_actions_percentage);
				
				mine(arg0_user, "none", Math.ceil(user_id.civilian_actions*0.5));
				forage(arg0_user, "none", Math.ceil(user_id.civilian_actions*0.5));
			}
		}
			
		news.push(national_news);
		
	}
	// 
	function mine (arg0_user, arg1_msg, arg2_actions) {
		var user_id = main.users[arg0_user];
		var inventory = main.users[arg0_user]["inventory"];
		var mineable_materials = ["coal","iron","lead","gold","petrol","rocks"];
		
		//["coal","iron","lead","gold","petrol","wood","rocks"],
		var resource_list = "";
		var out_of_actions = false;
		
		for (var i = 0; i < arg2_actions; i++) {
			if (user_id.actions > 0) {
				var random_resource = randomElement(mineable_materials);
				user_id.actions--;
				inventory[random_resource] = inventory[random_resource] + 1;
				resource_list = resource_list + (random_resource + ", ");
			} else {
				out_of_actions = true;
			}
		}
		
		if (arg1_msg != "none") {
			arg1_msg.channel.send("You dug up " + resource_list + "whilst on your mining haul.");
			if (out_of_actions) {
				arg1_msg.channel.send("You then proceeded to run out of actions.");
			}
		}
	}
	
	function forage (arg0_user, arg1_msg, arg2_actions) {
		var user_id = main.users[arg0_user];
		var inventory = main.users[arg0_user]["inventory"];
		
		var salvaged_wood = 0;
		var out_of_actions = false;
		
		for (var i = 0; i < arg2_actions; i++) {
			if (user_id.actions > 0) {
				user_id.actions--;
				inventory["wood"] = inventory["wood"] + 1;
				salvaged_wood++;
			} else {
				out_of_actions = true;
			}
		}
		
		if (arg1_msg != "none") {
			arg1_msg.channel.send("You chopped " + salvaged_wood + " wood.");
			if (out_of_actions) {
				arg1_msg.channel.send("You then proceeded to run out of actions.");
			}
		}
	}
	
	function setGovernment (arg0_user, arg1_type) {
		var user_id = arg0_user;
		user_id.government = arg1_type;
		user_id["politics"][arg1_type] = 100;
		if (arg1_type == "democracy") {
			user_id.manpower_percentage = 0.05;
			user_id.max_tax = 1.00;
			user_id.civilian_actions_percentage = 0.50;
		} else if (arg1_type == "monarchy") {
			user_id.manpower_percentage = 0.05;
			user_id.max_tax = 0.50;
			user_id.civilian_actions_percentage = 0.10;
		} else if (arg1_type == "dictatorship") {
			user_id.manpower_percentage = 0.15;
			user_id.max_tax = 0.70;
			user_id.civilian_actions_percentage = 0.00;
		} else if (arg1_type == "oligarchy") {
			user_id.manpower_percentage = 0.10;
			user_id.max_tax = 0.60;
			user_id.civilian_actions_percentage = 0.10;
		} else if (arg1_type == "republic") {
			user_id.manpower_percentage = 0.03;
			user_id.max_tax = 0.50;
			user_id.civilian_actions_percentage = 0.30;
		}
	}
	
	//Command functions
	{
		function randomElement (arg0_array) {
			return arg0_array[Math.floor(Math.random() * arg0_array.length)];
		}
		
		function initVar (arg0_variable, arg1_value) {
			if (arg0_variable == undefined) {
				arg0_variable = arg1_value;
			}
		}			
		
		function initUser (arg0_user) {
			var current_user = arg0_user.toString();
			var already_registered = false;
			for (var i = 0; i < main.user_array.length; i++) {
				if (main.user_array[i] == current_user) {
					already_registered = true;
				}
			}
			
			if (main.users[current_user] == undefined) { main.users[current_user] = {}; }
			if (main.users[current_user].name == undefined) { main.users[current_user].name = ""; }
			if (main.users[current_user].government == undefined) { main.users[current_user].government = ""; }
			if (main.users[current_user].technology_level == undefined) { main.users[current_user].technology_level = 1; }
			if (main.users[current_user].population == undefined) { main.users[current_user].population = 10000000; }
			if (main.users[current_user].used_manpower == undefined) { main.users[current_user].used_manpower = 0; }
			if (main.users[current_user].initial_manpower == undefined) { main.users[current_user].initial_manpower = 5000000; }
			if (main.users[current_user].manpower_percentage == undefined) { main.users[arg0_user].manpower_percentage = 0.50; }
			if (main.users[current_user].money == undefined) { main.users[current_user].money = 10000; }
			if (main.users[current_user].stability == undefined) { main.users[current_user].stability = 50; }
			if (main.users[current_user].coup_this_turn == undefined) { main.users[current_user].coup_this_turn = false; }
			if (main.users[current_user].overthrow_this_turn == undefined) { main.users[current_user].overthrow_this_turn = false; }
			
			//Modifiers
			if (main.users[current_user].tax_rate == undefined) { main.users[current_user].tax_rate = 0; }
			if (main.users[current_user].max_tax == undefined) { main.users[current_user].max_tax = 0; }
			if (main.users[current_user].pop_available == undefined) { main.users[current_user].pop_available = 0.5; }
			
			if (main.users[current_user].production_buildings_modifier == undefined) { main.users[current_user].production_buildings_modifier = 1; }
			if (main.users[current_user].pop_growth_modifier == undefined) { main.users[current_user].pop_growth_modifier = 1.0539; }
			
			//Sub-objects
			if (main.users[current_user]["inventory"] == undefined) { main.users[current_user]["inventory"] = {}; }
			if (main.users[current_user]["buildings"] == undefined) { main.users[current_user]["buildings"] = {}; }
			if (main.users[current_user]["military"] == undefined) { main.users[current_user]["military"] = {}; }
			if (main.users[current_user]["politics"] == undefined) { main.users[current_user]["politics"] = {}; }
			
			//Crafting values
			if (main.users[current_user].actions == undefined) { main.users[current_user].actions = 10; }
			if (main.users[current_user].civilian_actions == undefined) { main.users[current_user].civilian_actions = 0; }
			if (main.users[current_user].civilian_actions_percentage == undefined) { main.users[current_user].civilian_actions_percentage = 0; }
			
			//Modifiers - Only staff can set these
			if (main.users[current_user].blockaded == undefined) { main.users[current_user].blockaded = false; }
			
			//Add all materials to inventory
			for (var i = 0; i < config.materials.length; i++) {
				if (main.users[current_user]["inventory"][config.materials[i]] == undefined) { main.users[current_user]["inventory"][config.materials[i]] = 0; }
			}
			
			//Add all buildings
			for (var i = 0; i < config.buildings.length; i++) {
				if (main.users[current_user]["buildings"][config.buildings[i]] == undefined) { main.users[current_user]["buildings"][config.buildings[i]] = 0; }
			}
			
			//Add all political parties
			for (var i = 0; i < government_list.length; i++) {
				if (main.users[current_user]["politics"][government_list[i]] == undefined) { main.users[current_user]["politics"][government_list[i]] = 0; }
			}
			
			//Add all military units
			for (var i = 0; i < config.units.length; i++) {
				if (main.users[current_user]["military"][config.units[i]] == undefined) { main.users[current_user]["military"][config.units[i]] = 0; }
			}
			
			if (main.users[current_user].last_election == undefined) { main.users[current_user].last_election = 0; }
			
			if (already_registered == false) {
				main.user_array.push(current_user);
				main.users[current_user]["buildings"].mines = 3;
				main.users[current_user]["buildings"].watermills = 1;
			}
		}
		
		function modifyItem (arg0_user, arg1_amount, arg2_item, arg3_mode) {
			
			var current_user = arg0_user.toString();
			
			if (arg3_mode == "add") {
				if (main.users[current_user] == undefined) {
					initUser(current_user);
					main.users[current_user]["inventory"][arg2_item] = main.users[current_user]["inventory"][arg2_item] + parseInt(arg1_amount);
				} else {
					main.users[current_user]["inventory"][arg2_item] = main.users[current_user]["inventory"][arg2_item] + parseInt(arg1_amount);
				}
			} else if (arg3_mode == "remove") {
				if (main.users[current_user] == undefined) {
					initUser(current_user);
					main.users[current_user]["inventory"][arg2_item] = main.users[current_user]["inventory"][arg2_item] - parseInt(arg1_amount);
				} else {
					main.users[current_user]["inventory"][arg2_item] = main.users[current_user]["inventory"][arg2_item] - parseInt(arg1_amount);
				}
			}
			
		}
		
		function give (arg0_user, arg1_user2, arg2_amount, arg3_item, arg4_mode, arg5_message) {
			if (main.users[arg0_user] != undefined) {
				var usr = main.users[arg0_user];
				var other_usr = main.users[arg1_user2];
				var inventory = main.users[arg0_user]["inventory"];
				if (arg4_mode == "item") {
					if (arg3_item == "money") {
						if (usr.money >= arg2_amount) {
							usr.money = usr.money - arg2_amount;
							other_usr.money = other_usr.money + arg2_amount;
							arg5_message.channel.send("You sent <@" + arg1_user2 + "> " + arg2_amount + " money.");
						} else {
							arg5_message.channel.send("You were unable to execute this command due to a shortage of money.");
						}
					} else {
						var item_exists = false;
						for (var i = 0; i < config.materials.length; i++) {
							if (arg3_item == config.materials[i]) {
								item_exists = true;
							}
						}
						if (item_exists) {
							if (inventory[arg3_item] >= arg2_amount) {
								inventory[arg3_item] = inventory[arg3_item] - arg2_amount;
								other_usr["inventory"][arg3_item] = other_usr["inventory"][arg3_item] + arg2_amount;
								arg5_message.channel.send("You gave <@" + arg1_user2 + "> " + arg2_amount + " " + arg3_item + ".");
							} else {
								arg5_message.channel.send("You were unable to execute this command due to a shortage of items.");
							}
						} else {
							arg5_message.channel.send("The item you are trying to send is nonexistent!");
						}
					}
				} else if (arg4_mode == "industry") {
					var building_exists = false;
					for (var i = 0; i < config.buildings.length; i++) {
						if (arg3_item == config.buildings[i]) {
							building_exists = true;
						}
					}
					if (building_exists) {
						if (usr["buildings"][arg3_item] >= arg2_amount) {
							usr["buildings"][arg3_item] = usr["buildings"][arg3_item] - arg2_amount;
							other_usr["buildings"][arg3_item] = other_usr["buildings"][arg3_item] + arg2_amount;
							arg5_message.channel.send("You gave <@" + arg1_user2 + "> " + arg2_amount + " " + arg3_item + ".");
						} else {
							arg5_message.channel.send("You were unable to execute this command due to a shortage of buildings.");
						}
					} else {
						arg5_message.channel.send("The item you are trying to send is nonexistent!");
					}
				} else if (arg4_mode == "military") {
					var unit_exists = false;
					for (var i = 0; i < config.units.length; i++) {
						if (arg3_item == config.units[i]) {
							unit_exists = true;
						}
					}
					if (unit_exists) {
						if (usr["military"][arg3_item] >= arg2_amount) {
							usr["military"][arg3_item] = usr["military"][arg3_item] - arg2_amount;
							other_usr["military"][arg3_item] = other_usr["military"][arg3_item] + arg2_amount;
							arg5_message.channel.send("You gave <@" + arg1_user2 + "> " + arg2_amount + " " + arg3_item + ".");
						} else {
							arg5_message.channel.send("You were unable to execute this command due to a shortage of military units.");
						}
					} else {
						arg5_message.channel.send("The item you are trying to send is nonexistent!");
					}
				}
			} else {
				arg5_message.channel.send("The person you are trying to give items to doesn't even have a country!");
			}
		}
		
		function printInv (arg0_user, arg1_username, arg2_msg) {
			var inv_string = [];
			
			if (main.users[arg0_user] == undefined) {
				arg2_msg.channel.send("The person you are looking for has no inventory!");
			} else {
			
				inv_string.push("User: <@" + arg0_user + ">");
				inv_string.push("------------------ \n**Materials:**\n");
				
				for (var i = 0; i < config.materials.length; i++) {
					if (main.users[arg0_user]["inventory"][config.materials[i]] != undefined) {
						inv_string.push(config.materials[i] + ": " + main.users[arg0_user]["inventory"][config.materials[i]]);
					}
				}
					
				arg2_msg.channel.send(inv_string.join("\n"));
			}
		}
		
		function printBuildings (arg0_user, arg1_username, arg2_msg) {
			var building_string = [];
			
			if (main.users[arg0_user] == undefined) {
				arg2_msg.channel.send("The person you are looking for is stateless!");
			} else {
				building_string.push("User: <@" + arg0_user + ">");
				building_string.push("------------------ \n**Industry:**\n");
						
				var minimum = main.users[arg0_user]["buildings"]["mines"] + main.users[arg0_user]["buildings"]["watermills"]*2 + main.users[arg0_user]["buildings"]["factories"]*3;
				var maximum = main.users[arg0_user]["buildings"]["mines"] + main.users[arg0_user]["buildings"]["watermills"]*2 + main.users[arg0_user]["buildings"]["factories"]*5;
				
				for (var i = 0; i < config.buildings.length; i++) {
					if (main.users[arg0_user]["buildings"][config.buildings[i]] != undefined) {
						
						if (config.buildings[i] == "mines") {
							building_string.push(config.buildings[i] + ": " + main.users[arg0_user]["buildings"][config.buildings[i]] + ", " + main.users[arg0_user]["buildings"][config.buildings[i]] + " actions per turn.");
						} else if (config.buildings[i] == "watermills") {
							building_string.push(config.buildings[i] + ": " + main.users[arg0_user]["buildings"][config.buildings[i]] + ", " + main.users[arg0_user]["buildings"][config.buildings[i]]*2 + " actions per turn.");
						} else if (config.buildings[i] == "factories") {
							building_string.push(config.buildings[i] + ": " + main.users[arg0_user]["buildings"][config.buildings[i]] + ", " + main.users[arg0_user]["buildings"][config.buildings[i]]*3 + "-" + main.users[arg0_user]["buildings"][config.buildings[i]]*5 + " actions per turn.");
						}
					}
				}
						
				building_string.push("\n**Total Actions** per turn: " + minimum + "-" + maximum + " actions per round.");
					
				arg2_msg.channel.send(building_string.join("\n"));
			}
		}
		
		function printStats (arg0_user, arg1_username, arg2_msg) {
			var stats_string = [];
			
			if (main.users[arg0_user] == undefined) {
				arg2_msg.channel.send("The person you are looking for has no country!");
				
			} else {
				
				var percentage_manpower = main.users[arg0_user].manpower_percentage*100;
				
				stats_string.push("User: <@" + arg0_user + ">");
				stats_string.push("Country: " + main.users[arg0_user].name);
				stats_string.push("------------------ \n**Statistics:**\n");
				stats_string.push("Population: " + main.users[arg0_user].population);
				stats_string.push("Manpower: (" + main.users[arg0_user].used_manpower + "/" + main.users[arg0_user].initial_manpower + ") ¦ (" + percentage_manpower + "%)");
				stats_string.push("Technological Level: " + main.users[arg0_user].technology_level);
				stats_string.push("Money: " + main.users[arg0_user].money);
				stats_string.push("------------------ \n**Internal Politics:**\n");
				stats_string.push("Tax Rate: " + main.users[arg0_user].tax_rate*100 + "%");
				stats_string.push("Stability: " + main.users[arg0_user].stability + "%");
				stats_string.push("Blockaded: " + main.users[arg0_user].blockaded);
				stats_string.push("------------------ \n**Actions:**\n");
				stats_string.push("Civilian Actions: " + main.users[arg0_user].civilian_actions_percentage*100 + "%");
				stats_string.push("Actions: " + main.users[arg0_user].actions);
					
				arg2_msg.channel.send(stats_string.join("\n"));
			}
		}
		
		function printPolitics (arg0_user, arg1_username, arg2_msg) {
			var politics_string = [];
			
			if (main.users[arg0_user] == undefined) {	
				arg2_msg.channel.send("The person you are looking for has no country!");
				
			} else {
				
				politics_string.push("User: <@" + arg0_user + ">");
				politics_string.push("Country: " + main.users[arg0_user].name);
				politics_string.push("------------------ \n**Ruling Government:**\n");
				politics_string.push("Government Type: " + main.users[arg0_user].government);
				/*politics_string.push("------------------ \n**Internal Politics:**\n");
				for (var i = 0; i < government_list.length; i++) {
					politics_string.push(main.users[arg0_user]["politics"][government_list[i]] + "% of the population believes in " + government_list[i] + ".");
				}*/
				arg2_msg.channel.send(politics_string.join("\n"));
			}
		}
		
		function printStability (arg0_user, arg1_username, arg2_msg) {
			var stability_string = [];
			
			if (main.users[arg0_user] == undefined) {	
				arg2_msg.channel.send("The person you are looking for has no country!");
			} else {
				var user_id = main.users[arg0_user];
				var tax_rate = user_id.tax_rate;
				var ruling_party_popularity = user_id["politics"][user_id.government];
				
				var stab_government_modifier = 0;
				var stab_government_text = "";
				var stab_government_prefix = "";
				
				if (user_id.government != "communism" && user_id.government != "fascism" && user_id.government != "dictatorship" && user_id.government != "monarchy") {
					stab_government_modifier = 5;
					stab_government_text = "due to the current government being a " + user_id.government + ".";
					stab_government_prefix = "+";
				} else {
					stab_government_modifier = -5;
					stab_government_text = "due to an authoritarian regime in power.";
				}
				
				var calculated_stability = Math.ceil(ruling_party_popularity + stab_government_modifier - tax_rate*100);
				
				stability_string.push("User: <@" + arg0_user + ">");
				stability_string.push("Country: " + main.users[arg0_user].name);
				stability_string.push("------------------ \n**Stability:**\n");
				stability_string.push("**+" + Math.ceil(ruling_party_popularity) + "%** from ruling party popularity.");
				stability_string.push("**-" + Math.ceil(tax_rate*100) + "%** from current tax rate.");
				stability_string.push("**" + stab_government_prefix + stab_government_modifier + "%** " + stab_government_text);
				stability_string.push("------------------ \n**Calculated Stability:**\n");
				stability_string.push("Calculated Stability: **" + calculated_stability + "%**");
				stability_string.push("Current Stability: **" + user_id.stability + "%**");
				
				arg2_msg.channel.send(stability_string.join("\n"));
			}
		}
		
		function printMilitary (arg0_user, arg1_username, arg2_msg) {
			var military_string = [];
			
			if (main.users[arg0_user] == undefined) {	
				arg2_msg.channel.send("The person you are looking for has no country!");
				
			} else {
				
				military_string.push("User: <@" + arg0_user + ">");
				military_string.push("Country: " + main.users[arg0_user].name);
				military_string.push("------------------ \n**Military Units:**\n");
				for (var i = 0; i < config.units.length; i++) {
					military_string.push("**" + config.units[i] + "**: " + main.users[arg0_user]["military"][config.units[i]]);
				}
				arg2_msg.channel.send(military_string.join("\n"));
			}
		}
		
		function buildRequest (arg0_user, arg1_message, arg2_name, arg3_costs, arg4_build_request, arg5_amount) {
			//Costs: [[5, "iron"],[1, "stone"]]
			var usr = arg0_user;
			var inventory = usr["inventory"];
			var print_results = [];
			
			var remaining_manpower = usr.initial_manpower - usr.used_manpower;
			
			if (arg4_build_request == arg2_name) {
				for (var x = 0; x < arg5_amount; x++) {
					console.log("Request to build " + arg5_amount + " " + arg2_name + " was recieved.");
					var checks_passed = 0;
					
					for (var i = 0; i < arg3_costs.length; i++) {
						if (arg3_costs[i][1] == "manpower") {
							if (remaining_manpower >= arg3_costs[i][0]) {
								checks_passed++;
								usr.used_manpower = usr.used_manpower + arg3_costs[i][0];
							}
						} else if (arg3_costs[i][1] == "money") {
							if (usr.money >= arg3_costs[i][0]) {
								checks_passed++;
								usr.money = usr.money - arg3_costs[i][0];
							}
						} else if (arg3_costs[i][1] == "tech") {
							if (usr.technology_level >= arg3_costs[i][0]) {
								checks_passed++;
							}
						} else {
							if (inventory[arg3_costs[i][1]] >= arg3_costs[i][0]) {
								checks_passed++;
								inventory[arg3_costs[i][1]] = inventory[arg3_costs[i][1]] - arg3_costs[i][0];
							}
						}
					}
				
					if (checks_passed >= arg3_costs.length) {
						var single_object = arg2_name;
						single_object = single_object.replace("factories","factory");
						single_object = single_object.replace(/s$/,"")
						print_results.push("You have successfully built a **" + single_object + "**!");
						usr["buildings"][arg2_name]++;
					} else {
						print_results.push("You don't have the resources to build this!");
						console.log(print_results.join("\n"));
					}
				}
			
				arg1_message.channel.send(print_results.join("\n"));
			}
		}
		
		function build (arg0_user, arg1_msg, arg2_building, arg3_amount) {
			if (main.users[arg0_user] == undefined) {
				arg1_msg.channel.send("You don't have a country yet!");
			} else {
				var usr = main.users[arg0_user];
				var inventory = main.users[arg0_user]["inventory"];
				var result_string = [];
				var building_exists = false;
				//buildings: ["farms","fisheries","pastures","mines","quarries","lumberjacks","textile_mill","concrete_factory","food_processing_facilities","refineries","plastics_factory","lumbermill","steelworks","aluminium_factory","dockyards","tank_factories","artillery_factories","barracks","gun_factories","armaments","ammunition_factories","aeroplane_factories","neighbourhood","financial_district","town","city","metropolis"],
				//materials: ["bauxite","coal","gold","iron","lead","petroleum","stone","uranium","wood","wool","fish","meat","vegetables","wheat","clothes","concrete","food","lumber","plastics","refined_petroleum","steel","aluminium","uniforms","small_arms","ammunition","support_equipment"],
				for (var i = 0; i < config.buildings.length; i++) {
					if (arg2_building == config.buildings[i]) {
						building_exists = true;
					}
				}
				if (building_exists) {
					//buildRequest(usr, arg1_msg, "farms", [[10, "lumber"], [5, "iron"], [1500, "money"], [500, "manpower"]], arg2_building, arg3_amount);
					buildRequest(usr, arg1_msg, "mines", [[1, "iron"], [3, "wood"], [2, "rocks"], [2500, "manpower"], [1, "tech"]], arg2_building, arg3_amount);
					buildRequest(usr, arg1_msg, "watermills", [[2, "iron"], [10, "wood"], [5000, "manpower"], [2, "tech"]], arg2_building, arg3_amount);
					buildRequest(usr, arg1_msg, "factories", [[6, "iron"], [5, "wood"], [5, "coal"], [25000, "manpower"], [3, "tech"]], arg2_building, arg3_amount);
				} else {
					result_string.push("You were unable to build this building.");
				}
				
				arg1_msg.channel.send(result_string.join("\n"));
			}
		}
		
		function craftRequest (arg0_user, arg1_message, arg2_name, arg3_costs, arg4_build_request, arg5_amount, arg6_int) {
			//Costs: [[5, "iron"],[1, "stone"]]
			var usr = arg0_user;
			var military = usr["military"];
			var inventory = usr["inventory"];
			var print_results = [];
			var tech_request = false;
			
			var remaining_manpower = usr.initial_manpower - usr.used_manpower;
			
			if (arg4_build_request == arg2_name) {
				
				for (var x = 0; x < arg5_amount; x++) {
					console.log("Request to build " + arg5_amount + " " + arg2_name + " was recieved.");
					var checks_passed = 0;
					
					for (var i = 0; i < arg3_costs.length; i++) {
						if (arg3_costs[i][1] == "manpower") {
							if (remaining_manpower >= arg3_costs[i][0]) {
								checks_passed++;
								usr.used_manpower = usr.used_manpower + arg3_costs[i][0];
							}
						} else if (arg3_costs[i][1] == "money") {
							if (usr.money >= arg3_costs[i][0]) {
								checks_passed++;
								usr.money = usr.money - arg3_costs[i][0];
							}
						} else if (arg3_costs[i][1] == "tech") {
							if (usr.technology_level >= arg3_costs[i][0]) {
								checks_passed++;
							}
						} else {
							if (inventory[arg3_costs[i][1]] >= arg3_costs[i][0]) {
								checks_passed++;
								inventory[arg3_costs[i][1]] = inventory[arg3_costs[i][1]] - arg3_costs[i][0];
							}
						}
						
						if (arg2_name == "tech2") {
							if (usr.technology_level == 2 || usr.technology_level == 3) {
								checks_passed--;
							}
							tech_request = true;
						} else if (arg2_name == "tech3") {
							if (usr.technology_level == 3) {
								checks_passed--;
							}
							tech_request = true;
						}
						
					}
				
					if (checks_passed >= arg3_costs.length) {
						var single_object = arg2_name;
						single_object = single_object.replace("factories","factory");
						single_object = single_object.replace(/s$/,"")
						print_results.push("You have successfully built a **" + single_object + "**!");
						if (tech_request != true) {
							usr["military"][arg2_name] = usr["military"][arg2_name] + arg6_int;
						} else {
							if (arg2_name == "tech2") {
								usr.technology_level = 2;
								news.push("The country of " + usr.name + " advanced to being a tech 2 nation!");
							} else if (arg2_name == "tech3") {
								usr.technology_level = 3;
								news.push("The country of " + usr.name + " advanced to being a tech 3 nation!");
							}
						}
					} else {
						print_results.push("You were unable to craft this item!");
						console.log(print_results.join("\n"));
					}
				}
			
				arg1_message.channel.send(print_results.join("\n"));
			}
		}
		
		function craft (arg0_user, arg1_msg, arg2_crafting, arg3_amount) {
			if (main.users[arg0_user] == undefined) {
				arg1_msg.channel.send("You don't have a country yet!");
			} else {
				var usr = main.users[arg0_user];
				var military = main.users[arg0_user]["military"];
				var result_string = [];
				var unit_exists = false;
				
				for (var i = 0; i < config.buildings.length; i++) {
					if (arg2_crafting == config.units[i]) {
						unit_exists = true;
					}
				}
				if (unit_exists || arg2_crafting == "tech2" || arg2_crafting == "tech3") {
					//craftRequest(usr, arg1_msg, "farms", [[10, "lumber"], [5, "iron"], [1500, "money"], [500, "manpower"]], arg2_building, arg3_amount);
					craftRequest(usr, arg1_msg, "musketmen", [[1, "iron"], [1, "lead"], [2500, "money"], [50000, "manpower"], [1, "tech"]], arg2_crafting, arg3_amount, 50000);
					craftRequest(usr, arg1_msg, "tpships", [[1, "iron"], [5, "wood"], [1000, "money"], [80, "manpower"], [1, "tech"]], arg2_crafting, arg3_amount, 10);
					craftRequest(usr, arg1_msg, "galleons", [[1, "iron"], [1, "lead"], [5, "wood"], [2000, "money"], [800, "manpower"], [1, "tech"]], arg2_crafting, arg3_amount, 10);
					craftRequest(usr, arg1_msg, "riflemen", [[2, "iron"], [2, "lead"], [2500, "money"], [50000, "manpower"], [2, "tech"]], arg2_crafting, arg3_amount, 50000);
					craftRequest(usr, arg1_msg, "cannons", [[5, "iron"], [5, "wood"], [2000, "money"], [20000, "manpower"], [2, "tech"]], arg2_crafting, arg3_amount, 500);
					craftRequest(usr, arg1_msg, "ironclads", [[3, "iron"], [1, "lead"], [2500, "money"], [50000, "manpower"], [2, "tech"]], arg2_crafting, arg3_amount, 10);
					craftRequest(usr, arg1_msg, "infantry", [[3, "iron"], [3, "lead"], [2500, "money"], [50000, "manpower"], [3, "tech"]], arg2_crafting, arg3_amount, 50000);
					craftRequest(usr, arg1_msg, "tanks", [[5, "iron"], [5, "lead"], [2, "petrol"], [2500, "money"], [2000, "manpower"], [3, "tech"]], arg2_crafting, arg3_amount, 500);
					craftRequest(usr, arg1_msg, "battleships", [[3, "iron"], [5, "wood"], [5, "petrol"], [2500, "money"], [2000, "manpower"], [3, "tech"]], arg2_crafting, arg3_amount, 10);
					craftRequest(usr, arg1_msg, "bombers", [[3, "iron"], [2, "petrol"], [2500, "money"], [250, "manpower"], [3, "tech"]], arg2_crafting, arg3_amount, 50);
					craftRequest(usr, arg1_msg, "tpplanes", [[3, "iron"], [2, "petrol"], [2500, "money"], [50, "manpower"], [3, "tech"]], arg2_crafting, arg3_amount, 10);
					
					craftRequest(usr, arg1_msg, "tech2", [[2, "iron"], [5, "wood"], [2, "lead"], [10000, "money"], [1, "tech"]], arg2_crafting, arg3_amount, 1);
					craftRequest(usr, arg1_msg, "tech3", [[5, "iron"], [10, "wood"], [20000, "money"], [2, "tech"]], arg2_crafting, arg3_amount, 1);
					
					craftRequest(usr, arg1_msg, "settlers", [[5, "iron"], [5, "wood"], [5000, "money"], [1, "tech"]], arg2_crafting, arg3_amount, 1);
				} else {
					result_string.push("No such recipe exists!");
				}
				
				arg1_msg.channel.send(result_string.join("\n"));
			}
		}
	}
	
	//Logic
	{
		setTimeout(function(){
			console.log("[Ampersand] is ready to recieve data requests!");
			setInterval(function(){
				fs.writeFile('database.js', JSON.stringify(main), function (err,data) {
					if (err) {
						return console.log(err);
					}
					//console.log(data);
				});
				
				//Check if a turn has passed
				
				if (main.lastTurn == undefined) {
					main.lastTurn = new Date().getTime();
				} else {
					var current_date = new Date().getTime();
					var time_difference = current_date - main.lastTurn;
					if (time_difference > turn_timer*1000) {
						for (var i = 0; i < Math.floor(time_difference/(turn_timer*1000)); i++) {
				
							if (main.roundCount == undefined) {
								main.roundCount = 0;
							} else {
								main.roundCount++;
							}
							
							for (var x = 0; x < main.user_array.length; x++) {
								nextTurn(main.user_array[x]);
							}
							
							//console.log('[Country Battle] A turn has elapsed!');
							if (main.roundCount % 3 == 0) {
								returnChannel(announcements_channel).send("@🗾 ¦ Country A turn has elapsed! It is now round **" + main.roundCount + "**.\nThis round is an expansion round! DM @Vis#5102 the provinces you wish to colonise! Remember you can only colonise one province per settler unit!");
							} else {
								returnChannel(announcements_channel).send("@🗾 ¦ Country A turn has elapsed! It is now round **" + main.roundCount + "**.");
							}
							main.lastTurn = current_date;
							
							for (var x = 0; x < news.length; x++) {
								returnChannel(announcements_channel).send(news[x]);
							}
							
							news = [];
						}
					}
				}
				
			}, 100);
		},1000);
	}
}

client.on('ready', () => {
	client.user.setPresence({ activity: { name: "Midnighter RP"}, status: 'online'}).then(console.log).catch(console.error);
})

client.on('message', message => {
	//Get arguments
	var arg = [];
	
	//Initialisation end
	
	username = message.author.username;
	user_id = message.author.id;
    input = message.content;
	
	//Parse arguments
	arg = message.content.split(" ");
	console.log("Author: " + username);
	console.log(message.content);
	console.log(arg);
	
	if (arg[0].indexOf(bot_prefix) != -1) {
		
		//General commands
		{
			if (equalsIgnoreCase(arg[0], "help")) { //$help
				message.channel.send(help);
			}
			
			if (equalsIgnoreCase(arg[0], "roll")) { //$roll
				if (arg.length == 2) {
					//message.channel.send
					if (arg[1].indexOf("-") == -1) { //$roll arg1
						message.channel.send("You rolled a **" + randomNumber(1, parseInt(arg[1])) + "**.");
					} else { //$roll arg1-arg2
						var subargs = arg[1].split("-");
						message.channel.send("You rolled a **" + randomNumber(subargs[0], subargs[1]) + "**.");
					}
				} else if (arg.length == 3) {
					message.channel.send("You rolled a **" + randomNumber(parseInt(arg[1]), parseInt(arg[2])) + "**.");
				}
			}
		}
		
		//Administrative commands
		{
			if (hasRole(message, 'First Minister (Moderator)')) {
				if (equalsIgnoreCase(arg[0], "create")) { //$create @user int material
					if (arg.length > 1) {
						var target_user = returnMention(arg[1]);
						var material_exists = false;
						
						for (var i = 0; i < config.materials.length; i++) {
							if (config.materials[i] == arg[3]) {
								material_exists = true;
							}
						}
						
						if (material_exists) { //Execute command
							modifyItem(target_user, arg[2], arg[3], "add");
							console.log(JSON.stringify(main));
							message.channel.send("You gave " + arg[2] + " " + arg[3] + " to <@!" + target_user + ">.");
						} else {
							message.channel.send("Material '" + arg[3] + "' was not found.");
						}
					} else {
						message.channel.send("Invalid amount of arguments!");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "remove") || equalsIgnoreCase(arg[0], "delete")) { //$remove @user int material
					if (arg.length > 1) {
						var target_user = returnMention(arg[1]);
						var material_exists = false;
						
						for (var i = 0; i < config.materials.length; i++) {
							if (config.materials[i] == arg[3]) {
								material_exists = true;
							}
						}
						
						if (material_exists) { //Execute command
							modifyItem(target_user, arg[2], arg[3], "remove");
							console.log(JSON.stringify(main));
							message.channel.send("You gave " + arg[2] + " " + arg[3] + " to <@!" + target_user + ">.");
						} else {
							message.channel.send("Material '" + arg[3] + "' was not found.");
						}
					} else {
						message.channel.send("Invalid amount of arguments!");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "blockade")) { //$blockade <@user>
					if (arg.length > 1) {
						var target_user = returnMention(arg[1]);
						if (main.users[target_user] != undefined) {
							if (main.users[target_user].blockaded) {
								main.users[target_user].blockaded = false;
								message.channel.send("The country of " + main.users[target_user].name + " is no longer blockaded.");
							} else if (main.users[target_user].blockaded == false) {
								main.users[target_user].blockaded = true;
								message.channel.send("The country of " + main.users[target_user].name + " was blockaded.");
							}
						} else {
							message.channel.send("The person you are trying to blockade doesn't even have a country!");
						}
					} else {
						message.channel.send("Invalid amount of arguments!");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "eval")) { //$eval <@user> [property] [value]
					if (arg.length == 4) {
						var target_user = returnMention(arg[1]);
						eval("main.users['" + target_user + "']" + arg[2] + " = " + arg[3] + ";");
						message.channel.send("Eval command executed. Warning! This command can be highly unstable if not used correctly.");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "exhaust")) { //$eval <@user>
					if (arg.length == 2) {
						var target_user = returnMention(arg[1]);
						main.users[target_user]["units"].settlers = 0;
						message.channel.send("<@" + target_user + "> has exhausted their colonists on expansion!");
					}
				}
			}
		}
		
		//Country commands
		{
			if (hasRole(message, '🗾 ¦ Country')) {
				if (equalsIgnoreCase(arg[0], "found")) { //$found <country_name>
					var target_user = returnMention(user_id);
					
					if (arg.length > 1) {
						initUser(target_user);
						var full_name = [];
						for (var i = 1; i < arg.length; i++) {
							full_name.push(arg[i]);
						}
						main.users[target_user].name = full_name.join(" ");
						message.channel.send("You have been successfully registered!\nDo `$government <government>` to set your government type. For a list of available government types, type `$government list`.");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "government")) { //$government [list¦government_type]
					var target_user = returnMention(user_id);
					if (arg.length == 2 && main.users[target_user] != undefined) {
						if (arg[1] == "list") {
							message.channel.send("Valid governments: " + government_list.join(", "));
						} else {
							if (main.users[target_user].government == "") {
								var government_exists = false;
								
								for (var i = 0; i < government_list.length; i++) {
									if (government_list[i] == arg[1]) {
										government_exists = true;
									}
								}
								
								if (government_exists) {
									message.channel.send("Your government has been changed to: " + arg[1]);
									setGovernment(main.users[target_user], arg[1]);
									main.users[target_user]["politics"][arg[1]] = 100;
								} else {
									message.channel.send("That government does not exist!");
								}
							} else {
								message.channel.send("You can't change your government on a whim!");
							}
						}
					} else {
						message.channel.send("Too few arguments were included in your command. Please try again.");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "governments")) { //$governments
					message.channel.send(governments);
				}
				
				if (equalsIgnoreCase(arg[0], "cb")) { //$cb
					message.channel.send("https://media.discordapp.net/attachments/698769060443193354/700009946825097256/unknown.png");
				}
				
				if (equalsIgnoreCase(arg[0], "politics")) { //$politics <@user>
					if (arg.length == 1) {
						var target_user = returnMention(user_id);
						printPolitics(target_user, username, message);
					} else {
						var target_user = returnMention(arg[1]);
						printPolitics(target_user, username, message);
					}
				}
			
				if (equalsIgnoreCase(arg[0], "inv") || equalsIgnoreCase(arg[0], "inventory")) { //$inv <@user>
					if (arg.length == 1) {
						var target_user = returnMention(user_id);
						printInv(target_user, username, message);
					} else if (arg.length == 2) {
						var target_user = returnMention(arg[1]);
						printInv(target_user, username, message);
					}
				}
				
				if (equalsIgnoreCase(arg[0], "industry")) { //$industry <@user>
					if (arg.length == 1) {
						var target_user = returnMention(user_id);
						printBuildings(target_user, username, message);
					} else if (arg.length == 2) {
						var target_user = returnMention(arg[1]);
						printBuildings(target_user, username, message);
					}
				}
				
				if (equalsIgnoreCase(arg[0], "craft")) { //$craft <item>
					var target_user = returnMention(user_id);
					if (arg.length == 2) {
						var target_user = returnMention(user_id);
						if (arg[1] == "list") {
							message.channel.send("**Crafting List:**\n------------------ \n" + rawunitcosts.toString());
						} else {
							craft(target_user, message, arg[1], 1);
						}
					} else if (arg.length == 3) {
						craft(target_user, message, arg[1], arg[2]);
					}
				}
				
				if (equalsIgnoreCase(arg[0], "build")) { //$build <building> [int]
					//arg0_user, arg1_msg, arg2_building, arg3_amount
					var target_user = returnMention(user_id);
					if (arg.length == 2) {
						var target_user = returnMention(user_id);
						if (arg[1] == "list") {
							message.channel.send("**Building List:**\n------------------ \n" + rawbuildcosts.toString());
						} else {
							build(target_user, message, arg[1], 1);
						}
					} else if (arg.length == 3) {
						build(target_user, message, arg[1], arg[2]);
					} else {
						message.channel.send("Invalid number of arguments.");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "mine")) { //$mine [int]
					var target_user = returnMention(user_id);
					if (main.users[target_user].government == "") {
						message.channel.send("You don't even have a government!");
					} else {
						if (arg.length == 1) {
							//(arg0_user, arg1_msg, arg2_actions)
							mine(target_user, message, 1);
						} else if (arg.length == 2) {
							mine(target_user, message, arg[1]);
						} else {
							message.channel.send("Invalid amount of arguments!");
						}
					}
				}
				
				if (equalsIgnoreCase(arg[0], "forage")) { //$forage [int]
					var target_user = returnMention(user_id);
					if (main.users[target_user].government == "") {
						message.channel.send("You don't even have a government!");
					} else {
						if (arg.length == 1) {
							//(arg0_user, arg1_msg, arg2_actions)
							forage(target_user, message, 1);
						} else if (arg.length == 2) {
							forage(target_user, message, arg[1]);
						} else {
							message.channel.send("Invalid amount of arguments!");
						}
					}
				}
				
				if (equalsIgnoreCase(arg[0], "stats")) { //$stats <@user>
					if (arg.length == 1) {
						var target_user = returnMention(user_id);
						printStats(target_user, username, message);
					} else if (arg.length == 2) {
						var target_user = returnMention(arg[1]);
						printStats(target_user, arg[1], message);
					}
				}
				
				if (equalsIgnoreCase(arg[0], "military")) { //$military <@user>
					if (arg.length == 1) {
						var target_user = returnMention(user_id);
						printMilitary(target_user, username, message);
					} else if (arg.length == 2) {
						var target_user = returnMention(arg[1]);
						printMilitary(target_user, arg[1], message);
					}
				}
				
				if (equalsIgnoreCase(arg[0], "settax")) { //$settax [int]
					if (arg.length == 2) {
						var target_user = returnMention(user_id);
						var new_tax = arg[1]/100;
						if (new_tax <= main.users[target_user].max_tax && main.users[target_user] != undefined) {
							main.users[target_user].tax_rate = new_tax;
							message.channel.send("Your tax rate has been set to **" + arg[1] + "%**.");
						} else {
							message.channel.send("Your government type doesn't allow for such a high tax rate!");
						}
					} else {
						message.channel.send("Invalid amount of arguments!");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "coup")) { //$coup
					var target_user = returnMention(user_id);
					if (main.users[target_user] != undefined) {
						if (main.users[target_user].coup_this_turn == false) {
							main.users[target_user].coup_this_turn = true;
							message.channel.send("A coup has been initiated! It will occur next turn.");
						} else {
							message.channel.send("A coup has already been initiated! It will occur next turn.");
						}
					}
				}
				
				if (equalsIgnoreCase(arg[0], "overthrow")) { //$overthrow
					var target_user = returnMention(user_id);
					if (main.users[target_user] != undefined) {
						if (main.users[target_user].overthrow_this_turn == false) {
							main.users[target_user].overthrow_this_turn = true;
							message.channel.send("An overthrow of the government has been initiated! It will occur next turn.");
						} else {
							message.channel.send("An overthrow of the government has already been initiated! It will occur next turn.");
						}
					}
				}
				
				if (equalsIgnoreCase(arg[0], "vote")) { //$vote
					var target_user = returnMention(user_id);
					if (main.users[target_user] != undefined) {
						if (main.users[target_user].government == "republic" || main.users[target_user].government == "democracy") {
							var vote = randomNumber(0, 100);
							if (randomNumber >= 50) {
								message.channel.send("The motion was passed, with " + vote + "  ayes, and " + 100-vote + " nays.");
							} else {
								message.channel.send("The motion was rejected, with " + vote + "  ayes, and " + 100-vote + " nays.");
							}
						} else {
							message.channel.send("You aren't even a democratic nation! '100%' of your voters say yes.");
						}
					}
				}
				
				if (equalsIgnoreCase(arg[0], "nextround")) { //$nextround
					var current_date = new Date().getTime();
					var time_difference = current_date - main.lastTurn;
					
					message.channel.send("It is currently round **" + main.roundCount + "**.\n" + parseMilliseconds((turn_timer*1000)-time_difference) + " remaining until the next turn.");
				}
				
				if (equalsIgnoreCase(arg[0], "stability") || equalsIgnoreCase(arg[0], "stab")) { //$stab <@user>
					var target_user = returnMention(user_id);
					if (arg.length > 1) {
						target_user = returnMention(arg[1]);
						printStability(target_user, username, message);
					} else {
						printStability(target_user, username, message);
					}
				}
				
				//give(arg0_user, arg1_user2, arg2_amount, arg3_item, arg4_mode, arg5_message)
				
				if (equalsIgnoreCase(arg[0], "give")) { //$give <@user> <int> <item>
					if (arg.length == 4) {
						var target_user = returnMention(arg[1]);
						var current_user = returnMention(user_id);
						
						if (main.users[target_user].blockaded) {
							message.channel.send("The person you are trying to send these items to is currently blockaded!");
						} else {
							give(current_user, target_user, arg[2], arg[3], "item", message);
						}
					} else {
						message.channel.send("Invalid amount of arguments.");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "industrygive")) { //$industrygive <@user> <int> <item>
					if (arg.length == 4) {
						var target_user = returnMention(arg[1]);
						var current_user = returnMention(user_id);
						
						if (main.users[target_user].blockaded) {
							message.channel.send("The person you are trying to send these items to is currently blockaded!");
						} else {
							give(current_user, target_user, arg[2], arg[3], "industry", message);
						}
					} else {
						message.channel.send("Invalid amount of arguments.");
					}
				}
				
				if (equalsIgnoreCase(arg[0], "militarygive")) { //$militarygive <@user> <int> <item>
					if (arg.length == 4) {
						var target_user = returnMention(arg[1]);
						var current_user = returnMention(user_id);
						
						if (main.users[target_user].blockaded) {
							message.channel.send("The person you are trying to send these items to is currently blockaded!");
						} else {
							give(current_user, target_user, arg[2], arg[3], "military", message);
						}
					} else {
						message.channel.send("Invalid amount of arguments.");
					}
				}
			}
		}
		
		//Config commands
		{
			if (hasRole(message, 'Discord Developer')) {
				if (equalsIgnoreCase(arg[0], "set-announcements-channel")) { //$set-announcements-channel <channel id>
					if (arg[1] != undefined) {
						announcements_channel = arg[1];
						saveConfig();
						readConfig();
						message.channel.send("The announcements channel has been set to the following channel ID: " + arg[1] + ".\nIf the prefix doesn't work, try typing the command again.")
						announcements_channel = arg[1];
						saveConfig();
						readConfig();
					}
				}
				if (equalsIgnoreCase(arg[0], "set-prefix")) { //$set-prefix <prefix>
					if (arg[1] != undefined) {
						bot_prefix = arg[1];
						saveConfig();
						readConfig();
						message.channel.send("The bot prefix has been changed to " + arg[1] + ".\nIf the prefix doesn't work, try typing the command again.");
						help = rawhelp.toString().replace(/@/g, bot_prefix);
						
						bot_prefix = arg[1];
						saveConfig();
						readConfig();
						help = rawhelp.toString().replace(/@/g, bot_prefix);
					}
				}
				if (equalsIgnoreCase(arg[0], "set-round-time")) { //$set-round-time <seconds>
					if (arg[1] != undefined) {
						turn_timer = arg[1];
						saveConfig();
						readConfig();
						message.channel.send("Turns are now " + arg[1] + " seconds long.\nIf the prefix doesn't work, try typing the command again.");
						
						turn_timer = arg[1];
						saveConfig();
						readConfig();
					}
				}
				if (equalsIgnoreCase(arg[0], "reset-rounds")) { //$reset-rounds
					main.roundCount = 0;
					message.channel.send("Server rounds have been reset!");
				}
			}
		}
	}
})
