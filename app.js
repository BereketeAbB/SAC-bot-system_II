const express = require("express");
const axios = require("axios");
const path = require("path")
const { Telegraf } = require("telegraf");
const { MongoClient } = require('mongodb'); //something like mongoose
// const { session } = require('telegraf-session-mongodb'); //session control test
const { ServiceProvider } = require("./routes/ServiceProvider");
const { Admin } = require("./routes/Admin");
const { Student } = require("./routes/Student");
const {
	home,
	login,
	signup,
	aboutUs,
	generalError,
} = require("./routes/General");
const {
	isEmail, 
	isName, 
	isValidInitData
} = require("./util/Validator")

// const { db } = require("./database/Mongo")
/* --- DEV DEPENDANCIES --- */

require("dotenv").config(); 
const { HttpsProxyAgent } = require("https-proxy-agent"); 
const { log } = require("console");

/* --- --------------- --- */

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "./public")));
app.set("view engine", "ejs");

/** student endpoints */
app.get("/stud/send_requests", (req, res) => {
	res.render('html' + path.sep + 'stud' + path.sep + 'stud_send_requests');
});

app.get("/stud/check_appointments", (req, res) => {
	res.render('html' + path.sep + 'stud' + path.sep + 'stud_check_appointments');
});

app.get("/stud/login", (req, res) => {
	res.render('html' + path.sep + 'stud' + path.sep + 'stud_login');
});

app.get("/stud/signup", (req, res) => {
	res.render('html' + path.sep + 'stud' + path.sep + 'stud_signup');
});

app.get("/stud/verify", (req, res) => {
	res.render('html' + path.sep + 'stud' + path.sep + 'stud_verify');
});

/** --------------------------------------- */

/** service provider */
app.get("/donate", (req, res) => {
	res.render('html' + path.sep + 'sp' + path.sep + 'sp_check_appointments');
});

// app.get("/sp/send_requests", (req, res) => {
// 	res.render('html' + path.sep + 'sp' + path.sep + 'sp_send_requests');
// });

app.get("/sp/check_appointments", (req, res) => {
	res.render('html' + path.sep + 'sp' + path.sep + 'sp_check_appointments');
});

app.get("/sp/login", (req, res) => {
	res.render('html' + path.sep + 'sp' + path.sep + 'sp_login');
});

app.get("/sp/signup", (req, res) => {
	res.render('html' + path.sep + 'sp' + path.sep + 'sp_signup');
});

app.get("/sp/verify", (req, res) => {
	res.render('html' + path.sep + 'sp' + path.sep + 'sp_verify');
});

app.get("/sp/check_requests", (req, res) => {
	res.render('html' + path.sep + 'sp' + path.sep + 'sp_check_requests');
});

/** ---------------------------------- */

app.listen(process.env.PORT || 3000, "localhost", () => {
	console.log("Server listening on port 3000");
});

const botToken = process.env.BOT_TOKEN || "";
const bot = new Telegraf(botToken);
// , {
// 	telegram: {
// 		agent: new HttpsProxyAgent("http://127.0.0.1:3333"),
// 	},
// });

MongoClient.connect(process.env.MONGO_CONN, { useNewUrlParser: true, useUnifiedTopology: true })
.then(client => {
	const db = client.db();
	console.log("Database connected, successfully!")

/**
 * SERVICE PROVIDER AUTH
 */
  
app.post('/sp_signup', (req, res) => {
	const {provider_id, f_name, l_name, email, phone_no,		//Telegram ID
		educational_bkg, work_exp, health_team,
		office_location, available_at, initData} = req.body;
	
	const decodedUrlParams = new URLSearchParams(initData);
	const userId = JSON.parse(decodedUrlParams.get("user")).id;

	if (!isValidInitData(initData))
	{
		res.status(401).json({
			status: "error",
			result: {
				msg: "Not a valid request."
			}
		})
		return;
	}
	
	axios.post(process.env.API + "/service-provider/signup", { 
		provider_id, f_name, l_name, email, phone_no,		//Telegram ID
		educational_bkg, work_exp, sp_team : health_team,
		office_location, available_at, telegram_id : userId
	})
	.then((response) => {
		console.log(response)
		if (response.data.status && response.data.status == "success") {
			res.status(200).json({
				status : response.data.status,
				result : {
					msg : response.data.result.msg,
					route: process.env.BASE_WEB_API + "/sp/verify"
				}
			})
		} else if (response.data.status && response.data.status == "error" ){				// If the error from the backend is 'error' {whether it is from the res. or from the catch}
				res.status(500).json({
					status: false,
					result: {
						msg: response.data.result.msg || "Error not caught in catch"
					}
				})
		}
	}).catch((err) => {
		console.log(err.response.data)
		if(err.response.data.result && err.response.data.result.err && err.response.data.result.err.message){
			res.status(401).json({
				status: false,
				result: {
					msg: err.response.data.result.err.message,
					// route: process.env.BASE_WEB_API + "/html/sp/sp_login.html"
				}
			})
			return;
		}

		if (err.response.data && err.response.data.status && err.response.data.status == "error"){
			res.status(401).json({
				status: false,
				result: {
					msg: (err.response.data.result && err.response.data.result.msg) ? err.response.data.result.msg : "Axios Error: Can not send data to backend",			
				}
			})
		}
	})

})

app.post('/sp_login', (req, res) => {
	const { email, initData } = req.body

	if(!isEmail(email) || !isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Invalid request!"
			}
		})
		return
	}

	axios.post(process.env.API + "/service-provider/login", { email })
	.then((response) => {
		if( response.data.status && response.data.status == "success"){
			res.status(200).json({
				status: response.data.status,
				result: {
					msg: response.data.result.msg,		// You should have received a token via email
					route: process.env.BASE_WEB_API + "/sp/verify"
				}
			})
		}

		else if( response.data.status && response.data.status == "error"){
			res.status(500).json({
				status: "error",
				result: {
					msg: response.data.result.msg		//msg: Couldn't send an email
				}
			})
		}

		else if (response.data.status && response.data.status == "unauthorized"){
			res.status(401).json({
				status: "error",
				result: {
					msg : response.data.result.msg
				}
			})
		}
	})
	.catch((error) => {
		// console.log(error.response);
		res.status(500).json({
			status : "error",
			result : {
				msg : (
						error.response && 
						error.response.data && 
						error.response.data.result && 
						error.response.data.result.msg
					) ? error.response.data.result.msg : "Syncronization faild, please try again later.",
			}
		})
	})
})

app.post('/sp_verify', (req, res) => {
	const { token, initData} = req.body;

	if(!token || !isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Not a valid request."
			}
		})
		return;
	}

	const decodedUrlParams = new URLSearchParams(initData);
	const userId = JSON.parse(decodedUrlParams.get("user")).id;
	const fName = JSON.parse(decodedUrlParams.get("user")).first_name;

	axios.post(process.env.API +"/service-provider/verify", {token})
	.then((response) => {
		if(response.data.status && response.data.status == "success"){
			let collection = db.collection("sessions");
			
			try {
				let isSucc = collection.replaceOne(
					{ key: `${userId}:${userId}` },
					{ key: `${userId}:${userId}`, data: {
						token : `${response.data.result.token}`
					}},
					{ upsert: true }
				)

			} catch (error) {
				isSucc = {no : 0}
				console.log(error)
			}

			if (isSucc.no == 1){
				res.status(200).cookie({msg: response.data.result.token}).json({
					status: "success",
					result: {
						msg: response.data.result.msg
					}
				})

				let serviceProvider = new ServiceProvider(bot);
				serviceProvider.home(userId, fName);
			}else {
				try {
					const isSucc2 = collection.insertOne(
						{ key: `${userId}:${userId}` },
						{ key: `${userId}:${userId}`, data: {
							token : `${response.data.result.token}`
						}},
						{ upsert: true }
					)
					if (isSucc2.acknowledged) {
						res.status(200).cookie({msg: response.data.result.token}).json({
							status: "success",
							result: {
								msg: response.data.result.msg
							}
						});
	
						let serviceProvider = new ServiceProvider(bot);
						serviceProvider.home(userId, fName);
					} else {
						return res.status(401).cookie({msg: response.data.result.token}).json({
							status: "error",
							result: {
								msg: "Couldn't set a session."
							}
						})
					}
				}catch (err) {
					console.log(err)
					return res.status(401).cookie({msg: response.data.result.token}).json({
						status: "error",
						result: {
							msg: "Couldn't set a session. try logout first"
						}
					})
				}

			}
			// res.status(200).cookie({msg: response.data.result.msg}).json({
			// 	status: "success",
			// 	result: {
			// 		msg: response.data.result.msg
			// 	}
			// })

			
		} else {
			res.status(500).json({
				status: "error",
				result: {
					msg: response.data.result.msg
				}
			})
		}
	}).catch((error) => {
		console.log(error)
		res.status(500).json({
			status: "success",
			result: {
				msg: "Axios Error, Cannot send data to the backend"
			}
		})
	})	
})

app.post('/hook/notify', async (req, res) => {
	const {initData, msg, stud_info, diagnosis, telegram_id} = req.body
	
	if(!isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Not a valid request."
			}
		})
		return;
	}
	
	if (typeof telegram_id == 'object'){
		for (let i = 0; i < telegram_id.length; i++){
			console.log(telegram_id[i])
			await setTimeout(() => 
				bot.telegram.sendMessage(
					telegram_id[i].telegram_id, 
					`
						<b>New student send you a diagnosis request.</b>
						🔹 Student ID : ${stud_info.result[0].stud_id}
						🔹 Name : ${stud_info.result[0].f_name} ${stud_info.result[0].l_name}
						🔹 Email : ${stud_info.result[0].email}
						🔹 Phone no : ${stud_info.result[0].phone_no}
					`,
					{
						parse_mode: "HTML",
						reply_markup : {
							inline_keyboard :[
								[{
									text: "✅ Accept and Set appointment",
									web_app : {
										url : process.env.BASE_WEB_API + "/sp/set_appointment/" + 
												(new Buffer.from(JSON.stringify(stud_info.result[0]))).toString('base64') +
												"/" + (new Buffer.from(JSON.stringify(diagnosis))).toString('base64')
									}
								}], [{
									text: "❌ Reject",
									callback_data : "reject_request"
								}]
							]
						}
					}
				)
			, 3000);
		}
	}
	res.status(202).json({
		status: "success",
		result: {
			msg: "Your request sent."
		}
	})
})

app.get('/sp/set_appointment/:studInfo/:diagnosis', (req, res) => {
	const studInfo = JSON.parse((new Buffer.from(req.params.studInfo, 'base64')).toString('ascii'))
	const diagnosis = JSON.parse((new Buffer.from(req.params.diagnosis, 'base64')).toString('ascii'))
	
	res.render('html' + path.sep + 'sp' + path.sep + 'set_appointment', {
		studInfo, diagnosis
	})
})

app.get('/sp_edit_appointment/:appointmentId/:initData', (req, res) => {
	//WebApp legitmacy check fails here but i'll try few thingswhat 
	let collection = db.collection("sessions");
	const initData = req.params.initData

	if(!isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Not a valid request."
			}
		})
		return;
	}

	const decodedUrlParams = new URLSearchParams(initData);
	const userId = JSON.parse(decodedUrlParams.get("user")).id;

	collection.findOne({key : `${userId}:${userId}`}).then((value) => {
		if (req.params.appointmentId && value && value.data && value.data.token){
			console.log(req.params.appointmentId);
			
			axios.get(process.env.API + "/service-provider/getAppointment/" + req.params.appointmentId, {
				headers: {
					Cookie: "token=" + value.data.token + ";"
				}
			}).then((response) => {
				console.log(response);
				res.render('html' + path.sep + 'sp' + path.sep + 'sp_edit_appointment', {
					token : value.data.token
				});
			}).catch((error) => {console.log(error)})
		}
	}).catch((reason)=>{
		res.status(403).json({
			status : "unauthorized",
			result: {
				msg: "unauthorized request"
			}
		})
	})

	
})

app.get("/sp/check_requests/:initData", (req, res) => {
	const {initData} = req.params;
	const collection = db.collection("sessions");

	if(!isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Not a valid request."
			}
		})
		return;
	}

	//lets brainstorm ideas here
	// res.render('html' + path.sep + 'sp' + path.sep + 'sp_check_requests');
})

/**
* USER AUTH
*/

app.post('/stud_signup', (req, res) => {
	const {stud_id, f_name, l_name, email, phone_no, ed_info, initData} = req.body

	if(!isValidInitData(initData)){
		return res.status(401).json({
			status: "error",
			result: {
				msg: "Invalid request!"
			}
		})
	}

	const decodedUrlParams = new URLSearchParams(initData);
	const userId = JSON.parse(decodedUrlParams.get("user")).id;

	axios.post(process.env.API + "/user/signup", 
		{stud_id, f_name, l_name, email, phone_no, telegram_id : userId, ed_info})
		.then((response) => {
			if (response.data.status && response.data.status == "success"){
				res.status(200).json({
					status: true,
					result: {
						msg: response.data.result.msg,
						route: process.env.BASE_WEB_API + '/stud/verify'
					}
				})
			} else {
				res.status().json({
					status: false,
					result: {
						msg: response.data.result.msg
					}
				})
			}
		}).catch((error) => {
			if(error.response && error.response.data && error.response.data.status == "error"){
				return res.status(500).json({
					status: false,
					result: {
						msg: error.response.data.result.msg
					}
				})
			}
			// if(error.response.status == 409){
			// 	return res.status(409).json({
			// 		status: false,
			// 		result: {
			// 			msg: error.response.data.result.msg,
			// 			error_code: error.response.data.result.error_code,
			// 			route: process.env.BASE_WEB_API + '/html/stud/stud_login.html'
			// 		}
			// 	})
			// }

			return res.status(500).json({
				status: false,
				result: {
					msg: error.response.data.result.msg || "Axios Error, Couldn't send data to the backend"
				}
			})
		}) 
})

app.post('/stud_login', (req, res) => {
	const {email, initData} = req.body;

	if(!isEmail(email) || !isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Invalid request!"
			}
		})
		return
	}

	axios.post(process.env.API + "/user/login", {email})
		.then((response) => {
			if(response.data.status && response.data.status == "success"){
				res.status(200).json({
					status: "success",
					result: {
						msg: response.data.result.msg,
						route: process.env.BASE_WEB_API + '/stud/verify'
					}
				})
			} else {
				res.status(500).json({
					status: "error",
					result: {
						msg: response.data.result.msg
					}
				})
			}
		}).catch((error)=> {
			let {response} = error
			 
			res.status(401).json({
				status: "error",
				msg: (response.data && response.data.result && response.data.result.msg) ? response.data.result.msg : "Error, some sort of error happened."
			})
		})
})

app.post('/stud_verify', (req, res) => {
	const {token, initData} = req.body;

	if(!isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Invalid request!"
			}
		})
		return
	}

	const decodedUrlParams = new URLSearchParams(initData);
	const userId = JSON.parse(decodedUrlParams.get("user")).id;
	const fName = JSON.parse(decodedUrlParams.get("user")).first_name;

	axios.post(process.env.API + "/user/verify", {token})
		.then(async (response) => {

			if(response.data.status && response.data.status == "success"){
				let collection = db.collection("sessions");
				const isSucc = await collection.replaceOne(
					{ key: `${userId}:${userId}` },
					{ key: `${userId}:${userId}`, data: {
						token : `${response.data.result.token}`,
						date : new Date()
					}},
					{ upsert: true }
				)
				// console.log(isSucc)

				if (isSucc.acknowledged){
					res.status(200).cookie({msg: response.data.result.token}).json({
						status: "success",
						result: {
							msg: response.data.result.msg
						}
					})
					
					// console.log(bot)
					let student = new Student(bot);
					student.home(userId, fName);
				}else {
					const isSucc2 = await collection.insertOne(replacement);

					if (isSucc2.acknowledged) {
						res.status(200).cookie({msg: response.data.result.token}).json({
							status: "success",
							result: {
								msg: response.data.result.msg
							}
						});

						// console.log(bot)

						let student = new Student(bot);
						student.home(userId, fName);
					} else {
						return res.status(401).cookie({msg: response.data.result.token}).json({
							status: "error",
							result: {
								msg: "Couldn't set a session."
							}
						})
					}
				}

				// let student = new Student(bot);
				// student.home(userId, fName);
			} else {
				res.status(500).json({
					status: "error",
					result: {
						msg: response.data.result.msg
					}
				})
			}
	}).catch((error) => {
		res.status(500).json({
			status: "success",
			result: {
				msg: "Axios Error, Cannot send data to the backend"
			}
		})
	})
})

app.post('/stud_send_request', async (req, res) => {
	const {sp_team, diagnosis, initData} = req.body;
	
	if(!isValidInitData(initData)){
		res.status(401).json({
			status: "error",
			result: {
				msg: "Invalid request!"
			}
		})
		return
	}
	
	const decodedUrlParams = new URLSearchParams(initData);
	const userId = JSON.parse(decodedUrlParams.get("user")).id;

	let collection = db.collection("sessions");
	await collection.findOne({key: `${userId}:${userId}`})
	.then((value) => {
		if (value && value.data && value.data.token){
			axios.post(process.env.API + "/user/addRequest", {
				client : "telegram",
				callbackUrl : process.env.BASE_WEB_API + "/hook/notify",
				stud_id : userId,
				sp_team : sp_team,
				token : value.data.token,
				issuedAt : new Date().getTime(),
				diagnosis : diagnosis,
				initData : initData,
			}).then((response) => {
				if(response.data.status && response.data.status == "success"){
					res.status(200).json({
						status: "success",
						result: {
							msg: "Your request sent successfully, we will notify you as soon as a service provider take a look at it."
						}
					})
				} else {
					res.status(500).json({
						status: "error",
						result: {
							msg: response.data.result.msg
						}
					})
				}
			}).catch((error) => {
				console.log("Line 585 :- ", error)
				res.status(500).json({
					status: "error",
					result: {
						msg: "Axios Error, Cannot send request to the backend " + JSON.stringify(error)
					}
				})
			})
		}		
	})
	.catch((err) => {
		console.log(err)
		res.status(401).json({
			status: "error",
			result: {
				msg: "Invalid request, you gonna have to login first."
			}
		})
	})	
})

/**
* ADMIN AUTH
*/

app.post('/admin_signup', (req, res) => {
const { f_name, l_name, email, speciality,
		working_hour, communication, phone_no } = req.body;

	axios.post(process.env.API+"/admin/signup", {
		f_name, l_name, email, speciality,
		working_hour, communication, phone_no
	}).then((response) => {
		if(response.data.status && response.data.status == "success"){
			res.status(200).json({
				status: "success",
				result: {
					msg: response.data.result.msg,
					route: './html/admin/admin_verify.html'
				}
			})
		} else {
			res.status(200).json({
				status: "error",
				result: {
					msg: response.data.result.msg
				}
			})
		}
	}).catch((error) => {
		res.status(500).json({
			status: "error",
			result: {
				msg: "Axios Error, Can not fetch data to backend"
			}
		})
	})

})

app.post('/admin_login', (req, res) => {
const { email } = req.body;

axios.post(process.env.API + "/admin/login", {
	email
})
	.then((response) => {
		if(response.data.status && response.data.status == "success"){
			res.status(200).json({
				status: "success",
				result: {
					msg: response.data.result.msg,
					route: './html/admin/admin_verify.html'
				}
			})
		} else {
			res.status(500).json({
				status: "error",
				result: {
					msg: response.data.result.msg
				}
			})
		}
	}).catch((error)=> {
		res.status(401).json({
			status: "error",
			msg: "Axios Error, Can not send data to the backend"
		})
	})
})

app.post('/admin_verify', (req, res) => {
const { token } = req.body;

axios.post(process.env.API + "/admin/verify", { token })
	.then((response) => {
		if (response.data.status && response.data.status == "success"){
			// bot.use((ctx, next)=>{
			// 	ctx.session.token = response.data.result.token;
			// 	next()
			// })
			// TO BE futher tested.
			res.status(200).json({
				status: "success",
				result: {
					msg: response.data.result.msg
				}
			})
		} else {
			res.status(500).json({
				status: "error",
				result: {
					msg: response.data.result.msg
				}
			})
		}
}).catch((error) => {
	res.status(500).json({
		status: "success",
		result: {
			msg: "Axios Error, Cannot send data to the backend"
		}
	})
})
})


bot.start(home);

bot.action("home", home); //this is the event that is going to be triggered when the <<back button is clicked
bot.action("login", login);
bot.action("signup", signup);
bot.action("about_us", aboutUs);

const serviceProvider = new ServiceProvider();
bot.action("sp_logout", serviceProvider.logout);
bot.action("y_sp_logout", serviceProvider.yesLogout);
bot.action("n_sp_logout", serviceProvider.noLogout);

bot.catch((err, ctx) => {
	console.error("Error occured in bot : ", err)
})
// bot.action("sp_appointments", serviceProvider.getAppointments);

const admin = new Admin();
const student = new Student();
/*
bot.on("message", async function (ctx) {
	if (
		ctx.message.web_app_data &&
		ctx.message.web_app_data.data &&
		ctx.message.web_app_data.button_text
	) {
		if (
			ctx.message.web_app_data.button_text.indexOf("Service Provider") !=
			-1
		) {
			try {
				const data = JSON.parse(ctx.message.web_app_data.data);
				if (data.type) {
					switch (data.type) {
						case 2343: //request type
							serviceProvider.login(ctx, data);
							break;
						case 2212:
							serviceProvider.signup(ctx);
							break;
					}
				}
			} catch (error) {
				generalError(ctx, "Invalid data, please try again.");
				console.log(error);
			}
		}
		if (ctx.message.web_app_data.button_text.indexOf("Student") != -1) {
			try {
				const data = JSON.parse(ctx.message.web_app_data.data);
				if (data.type) {
					switch (data.type) {
						case 2343: //request type
							student.login(ctx);
							break;
						case 2212:
							student.signup(ctx);
							break;
					}
				}
			} catch (error) {
				generalError(ctx, "Invalid data, please try again.");
				console.log(error);
			}
		}

		if (
			ctx.message.web_app_data.button_text.indexOf("Verify token") != -1
		) {
			ctx.session.logging_in = true;
			try {
				const data = JSON.parse(ctx.message.web_app_data.data);
				if (data.type) {
					switch (data.type) {
						case 7564: //role type
							serviceProvider.verify(ctx, data);
							break;
						case 1721:
							student.verify(ctx, data);
							break;
						case 4388:
							admin.verify(ctx, data);
							break;
					}
				}
			} catch (error) {
				generalError(ctx, "Invalid data, please try again.");
				console.log(error);
			}
		}
	}
});
*/
})
bot.launch();
