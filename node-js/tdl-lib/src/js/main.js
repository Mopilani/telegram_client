var { Client } = require("tdl");
var { TDLib } = require("tdl-tdlib-addon");
var folder = process.cwd();
var timers = require("timers/promises");
var update_lib = require("./update");
class telegram {
    constructor(pathDb = "./client/", client = {}) {
        if (typeof client != "object") {
            client = {};
        }
        if (!client) {
            client = {};
        }
        var option = {
            "apiId": 1917085,
            "apiHash": "a612212e6ac3ff1f97a99b2e0f050894",
            "databaseDirectory": `${folder}/${pathDb}`,
            "filesDirectory": `${folder}/${pathDb}`,
            "skipOldUpdates": true,
            "verbosityLevel": 0,
            "tdlibParameters": {
                "enable_storage_optimizer": true,
                "system_language_code": 'en',
                "application_version": "v1",
                "device_model": "Desktop",
                "system_version": "v5"
            },
            "pathTdLib": `${folder}/./libtdjson.so`,
            ...client
        };
        var tdlib = new TDLib(option["pathTdLib"]);
        this.option = option;
        this.client = new Client(tdlib, option);
        this.on_update = false;
    }

    async getClient() {
        return this.client;
    }

    async user() {
        try {
            this.client.connect().catch(e => {
                console.log(e.message);
                return false;
            });
            this.client.login(() => {
                type: 'user'
            }).catch(e => {
                console.log(e.message);
                return false;
            });
            return true;
        } catch (e) {
            console.log(e.message);
            return false;
        }
    }

    async bot(token_bot) {
        await this.client.connect();
        var data = {
            type: 'bot',
            token: token_bot,
            getToken: () => token_bot
        };
        await this.client.login(() => data);
        return true;
    }

    async on(type, callback) {
        if (RegExp("^update$", "i").exec(type)) {
            var clients = this.client;
            var option = this.option;
            var tg = this;
            var lib = update_lib;
            this.client.on("update", async function (updateTd) {
                var updateApi = new lib.updateApi(tg);
                var update = await updateApi.update(updateTd);
                return callback(update, updateTd, tg, option);
            });

        }
        if (RegExp("^raw$", "i").exec(type)) {
            this.client.on("update", async function (updateTd) {
                return callback(updateTd);
            });
        }
    }

    async request(method, option = {}) {
        if (typeof option["chat_id"] == "string" && option["chat_id"].length >= 5) {
            try {
                var searchPublicChat = await this.searchPublicChat(String(option["chat_id"]).replace(/(@)/ig, ""));
                if (searchPublicChat) {
                    if (searchPublicChat["_"] == "chat") {
                        option["chat_id"] = searchPublicChat["id"];
                    }
                }
            } catch (e) {

            }
        }
        if (typeof option["user_id"] == "string" && option["user_id"].length >= 5) {
            try {
                var searchPublicChat = await this.searchPublicChat(String(option["user_id"]).replace(/(@)/ig, ""));
                if (searchPublicChat) {
                    if (searchPublicChat["_"] == "chat") {
                        option["user_id"] = searchPublicChat["id"];
                    }
                }
            } catch (e) {

            }
        }


        if (RegExp(`^promoteChatMember$`, "i").exec(method)) {
            var optionparam = {
                "custom_title": option["custom_title"],
                "can_manage_chat": option["can_manage_chat"],
                "can_post_messages": option["can_post_messages"],
                "can_edit_messages": option["can_edit_messages"],
                "can_delete_messages": option["can_delete_messages"],
                "can_manage_voice_chats": option["can_manage_voice_chats"],
                "can_restrict_members": option["can_restrict_members"],
                "can_promote_members": option["can_promote_members"],
                "can_change_info": option["can_change_info"],
                "can_invite_users": option["can_invite_users"],
                "can_pin_messages": option["can_pin_messages"]
            };
            return await this.promoteChatMember(option["chat_id"], option["user_id"], optionparam);
        }

        if (RegExp(`^banChatMember$`, "i").exec(method)) {
            return await this.banChatMember(option["chat_id"], option["user_id"], option["banned_until_date"], option["revoke_messages"]);
        }

        if (RegExp(`^deleteMessage$`, "i").exec(method)) {
            return await this.deleteMessage(option["chat_id"], option["message_id"], true);
        }
        if (RegExp(`^searchPublicChat$`, "i").exec(method)) {
            var searchPublicChat = await this.searchPublicChat(option["username"]);
            if (searchPublicChat) {
                if (searchPublicChat["_"] == "chat") {
                    var getChat = await this.request("getChat", { "chat_id": searchPublicChat["id"] });
                    if (getChat["ok"]) {
                        return {
                            "status_bool": true,
                            "status_code": 200,
                            "result": getChat["result"]
                        };
                    } else {
                        return {
                            "status_bool": false,
                            "status_code": 400,
                            "result": {}
                        };

                    }
                }
            }
        }
        if (RegExp(`^searchPublicChats$`, "i").exec(method)) {
            var searchPublicChats = await this.searchPublicChats(option["query"]);
            if (searchPublicChats) {
                if (searchPublicChats["_"] == "chats") {
                    if (searchPublicChats["total_count"]) {
                        var chat_ids = searchPublicChats["chat_ids"];
                        var result = [];
                        for (var i = 0; i < chat_ids.length; i++) {
                            var loop_data = chat_ids[i];
                            try {
                                var getChat = await this.request("getChat", { "chat_id": loop_data });
                                if (getChat["ok"]) {
                                    result.push(getChat["result"]);
                                }
                            } catch (e) {

                            }

                        }
                        return {
                            "status_bool": true,
                            "status_code": 200,
                            "result": result
                        };

                    } else {
                        return {
                            "status_bool": false,
                            "status_code": 404,
                            "message": "Not found",
                            "result": []
                        };
                    }
                }

                throw {
                    "message": searchPublicChat
                };
            } else {
                throw {
                    "message": searchPublicChat
                };
            }
        }

        if (RegExp(`^sendBotStartMessage$`, "i").exec(method)) {
            var searchPublicChat = await this.searchPublicChat(option["username"]);
            if (searchPublicChat) {
                if (searchPublicChat["_"] == "chat") {
                    if (searchPublicChat["type"] && searchPublicChat["type"]["_"] == "chatTypePrivate") {
                        if (searchPublicChat["type"]["user_id"]) {
                            return await this.sendBotStartMessage(searchPublicChat["type"]["user_id"], searchPublicChat["type"]["user_id"], option["parameter"] ?? false);
                        }
                    }
                }

                throw {
                    "message": searchPublicChat
                };
            } else {
                throw {
                    "message": searchPublicChat
                };
            }
        }

        if (new RegExp(`^sendMessage$`, "i").exec(method)) {
            return await this.sendMessage(option["chat_id"], option["text"], option["parse_mode"], option["entities"], option["disable_web_page_preview"], option["disable_notification"], option["reply_to_message_id"], option["reply_markup"]);
        }

        if (new RegExp(`^sendPhoto$`, "i").exec(method)) {
            return await this.sendPhoto(option["chat_id"], option["photo"], option["caption"], option["parse_mode"], option["entities"], option["disable_notification"], option["reply_to_message_id"], option["reply_markup"])

        }

        if (new RegExp(`^sendAudio$`, "i").exec(method)) {
            return await this.sendAudio(option["chat_id"], option["audio"], option["caption"], option["parse_mode"], option["entities"], option["disable_notification"], option["reply_to_message_id"], option["reply_markup"])
        }

        if (new RegExp(`^sendVoice$`, "i").exec(method)) {
            return await this.sendVoice(option["chat_id"], option["voice"], option["caption"], option["parse_mode"], option["entities"], option["disable_notification"], option["reply_to_message_id"], option["reply_markup"])

        }

        if (new RegExp(`^sendVideo$`, "i").exec(method)) {
            return await this.sendVideo(option["chat_id"], option["video"], option["caption"], option["parse_mode"], option["entities"], option["disable_notification"], option["reply_to_message_id"], option["reply_markup"])
        }

        if (new RegExp(`^leaveChat$`, "i").exec(method)) {
            return await this.leaveChat(option["chat_id"])
        }
        if (new RegExp(`^getMessage$`, "i").exec(method)) {
            var getMessage = await this.getMessage(option["chat_id"], option["message_id"]);
            var json = {};
            json["_"] = "updateNewMessage";
            json["message"] = getMessage;
            var lib = new updateApi(this);
            var update = await lib.update(json);
            return update;
        }

        if (new RegExp(`^answerCallbackQuery$`, "i").exec(method)) {
            return await this.answerCallbackQuery(option["callback_query_id"], option["text"], option["show_alert"], option["url"], option["cache_time"])
        }
        if (new RegExp(`^getChatAdministrators$`, "i").exec(method)) {
            return await this.getChatAdministrators(option["chat_id"])
        }

        if (new RegExp(`^getChatMember$`, "i").exec(method)) {
            var getChatMember = await this.getChatMember(option["chat_id"], option["user_id"])
            if (!getChatMember["_"]) {
                await this.getChat(option["chat_id"]);
                return await this.request("getChatMember", { "chat_id": option["chat_id"], "user_id": option["user_id"] });
            } else if (new RegExp(`^chatMember$`, "i").exec(getChatMember["_"])) {
                var json = {};
                var getUser = await this.request("getUser", { "chat_id": getChatMember["member_id"]["user_id"] })
                json["user"] = getUser["result"];
                json["join_date"] = getChatMember["joined_chat_date"];
                var status = getChatMember["status"];
                json["status"] = status["_"].toLocaleLowerCase().replace(/(chatmemberstatus)/ig, "");
                json["custom_title"] = status["custom_title"];
                json["can_be_edited"] = status["can_be_edited"];
                json["can_manage_chat"] = status["can_manage_chat"];
                json["can_change_info"] = status["can_change_info"];
                json["can_post_messages"] = status["can_post_messages"];
                json["can_edit_messages"] = status["can_edit_messages"];
                json["can_delete_messages"] = status["can_delete_messages"];
                json["can_invite_users"] = status["can_invite_users"];
                json["can_restrict_members"] = status["can_restrict_members"];
                json["can_pin_messages"] = status["can_pin_messages"];
                json["can_promote_members"] = status["can_promote_members"];
                json["can_manage_voice_chats"] = status["can_manage_voice_chats"];
                json["is_anonymous"] = status["is_anonymous"];
                return { ok: true, result: json };
            } else {
                return { ok: false, result: getChatMember };
            }
        }
        if (new RegExp(`^editMessageText$`, "i").exec(method)) {
            return await this.editMessageText(option["chat_id"], option["message_id"], option["text"], option["parse_mode"], option["entities"], option["disable_web_page_preview"], option["reply_markup"])
        }
        if (new RegExp(`^editMessageReplyMarkup$`, "i").exec(method)) {
            return await this.editMessageReplyMarkup(option["chat_id"], option["message_id"], option["reply_markup"])
        }

        if (new RegExp(`^forwardMessage$`, "i").exec(method)) {
            return await this.forwardMessage(option["chat_id"], option["from_chat_id"], option["message_id"], false);
        }

        if (new RegExp(`^copyMessage$`, "i").exec(method)) {
            return await this.copyMessage(option["chat_id"], option["from_chat_id"], option["message_id"], option["caption"], option["parse_mode"], option["entities"], option["disable_notification"], option["reply_to_message_id"], option["reply_markup"]);
        }

        if (new RegExp(`^getChats$`, "i").exec(method)) {
            var getchats = await this.getChats();
            var list_chats = [];
            for (var index = 0; index < getchats["chat_ids"].length; index++) {
                var loop_data = getchats["chat_ids"][index];
                try {
                    var result = await this.request("getChat", {
                        "chat_id": loop_data
                    });
                    list_chats.push(result["result"]);
                } catch (e) {
                }
            }
            return {
                "status_code": 200,
                "status_bool": true,
                "result": list_chats
            };
        }

        if (new RegExp(`^getSupergroupMembers$`, "i").exec(method)) {
            var getMembers = await this.getSupergroupMembers(option["chat_id"], option["offset"])
            if (new RegExp("^chatMembers$", "i").exec(getMembers["_"])) {
                var json_data = {};
                json_data["total_count"] = getMembers["total_count"];
                var array = [];
                for (var i = 0; i < getMembers["members"].length; i++) {
                    var loop_data = getMembers["members"][i];
                    var getUser = await this.getUser(loop_data["user_id"])
                    if (new RegExp("^user$", "i").exec(getUser["_"])) {
                        var json = {};
                        json["id"] = getUser["id"];
                        try {
                            if (new RegExp("^userTypeBot$", "i").exec(getUser.type["_"])) {
                                json["is_bot"] = true;
                            } else {
                                json["is_bot"] = false;
                            }
                        } catch (e) {
                            json["is_bot"] = false;
                        }
                        json["first_name"] = getUser["first_name"];
                        if (getUser["last_name"]) {
                            json["last_name"] = getUser["last_name"];
                        }
                        if (getUser["username"]) {
                            json["username"] = getUser["username"];
                        }
                        if (getUser["phone_number"]) {
                            json["phone_number"] = getUser["phone_number"];
                        }
                        if (loop_data["status"]["_"]) {
                            json["status"] = loop_data["status"]["_"].toLocaleLowerCase().replace(/(chatMemberStatus)/ig, "")
                        }

                        if (getUser["language_code"]) {
                            json["language_code"] = getUser["language_code"];
                        }
                        json["detail"] = {
                            "is_contact": getUser["is_contact"],
                            "is_mutual_contact": getUser["is_mutual_contact"],
                            "is_verified": getUser["is_verified"],
                            "is_support": getUser["is_support"],
                            "is_scam": getUser["is_scam"],
                            "is_fake": getUser["is_fake"],
                            "have_acces": getUser["have_access"]
                        };
                        array.push(json);
                    }
                }
                json_data["data"] = array;
                return { "ok": true, "result": json_data };
            } else {
                return { "ok": false, "result": getMembers };

            }
        }
        if (new RegExp(`^joinChat$`, "i").exec(method)) {
            var joinChat = await this.joinChat(option["chat_id"])
            if (new RegExp("^ok$", "i").exec(joinChat["_"])) {
                return { "ok": true }
            } else {
                return { "ok": false }
            }
        }
        if (new RegExp(`^searchPublicChats$`, "i").exec(method)) {
            var searchPublicChats = await this.searchPublicChats(option.query)
            if (new RegExp("^chats$", "i").exec(searchPublicChats["_"])) {
                var json = {}
                if (searchPublicChats["total_count"] > 0) {
                    json.total_count = searchPublicChats["total_count"];
                    var array_data = []
                    for (var i = 0; i < searchPublicChats["chat_ids"].length; i++) {
                        var loop_data = searchPublicChats["chat_ids"][i];
                        var json_loop = {};
                        if (new RegExp("-.*", "i").exec(loop_data)) {
                            var data = {
                                "chat_id": loop_data
                            };
                            var getSupergroup = await this.request("getSupergroup", data);
                            if (getSupergroup["ok"]) {
                                json_loop["id"] = loop_data
                                var result = getSupergroup["result"]
                                if (result["username"]) {
                                    json_loop["username"] = result["username"]
                                }
                                if (result["type"]) {
                                    json_loop["type"] = result["type"];
                                }
                                json_loop["detail"] = result["detail"];
                            }
                        }
                        array_data.push(json_loop);

                    }
                    json["data"] = array_data;
                } else {
                    return { "ok": false };
                }
                return { "ok": true, "result": json };
            } else {
                return { "ok": false, "result": searchPublicChats };
            }
        }

        if (new RegExp(`^getSupergroup$`, "i").exec(method)) {
            var getSupergroup = await this.getSupergroup(option["chat_id"])
            if (new RegExp("^supergroup$", "i").exec(getSupergroup["_"])) {
                var json = {};
                json["id"] = Number(`-100${getSupergroup["id"]}`);
                if (getSupergroup["username"]) {
                    json["username"] = getSupergroup["username"];
                }
                if (getSupergroup["is_channel"]) {
                    json["type"] = "channel";
                } else {
                    json["type"] = "supergroup";
                }
                json["detail"] = {
                    "member_count": getSupergroup["member_count"],
                    "linked_chat": getSupergroup["has_linked_chat"],
                    "has_location": getSupergroup["has_location"],
                    "sign_messages": getSupergroup["sign_messages"],
                    "is_slow_mode_enabled": getSupergroup["is_slow_mode_enabled"],
                    "is_broadcast_group": getSupergroup["is_broadcast_group"],
                    "is_verified": getSupergroup["is_verified"],
                    "is_scam": getSupergroup["is_scam"],
                    "is_fake": getSupergroup["is_fake"]
                };
                return { "ok": true, "result": json };
            } else {
                return { "ok": false, "result": getSupergroup };
            }

        }
        if (new RegExp(`^getMe$`, "i").exec(method)) {
            var getMe = await this.getMe();
            if (new RegExp("^user$", "i").exec(getMe["_"])) {
                var json = {};
                json["id"] = getMe["id"];
                try {
                    if (new RegExp("^userTypeBot$", "i").exec(getMe["type"]["_"])) {
                        json["is_bot"] = true;
                    } else {
                        json["is_bot"] = false;
                    }
                } catch (e) {
                    json["is_bot"] = false;
                }
                json["first_name"] = getMe["first_name"];
                if (getMe["last_name"]) {
                    json["last_name"] = getMe["last_name"];
                }
                if (getMe["username"]) {
                    json["username"] = getMe["username"];
                }
                if (getMe["phone_number"]) {
                    json["phone_number"] = getMe["phone_number"];
                }
                if (getMe["status"]["_"]) {
                    json["status"] = getMe["status"]["_"].toLocaleLowerCase().replace(/(userStatus)/ig, "");
                }

                if (getMe["language_code"]) {
                    json["language_code"] = getMe["language_code"];
                }
                json["detail"] = {
                    "is_contact": getMe["is_contact"],
                    "is_mutual_contact": getMe["is_mutual_contact"],
                    "is_verified": getMe["is_verified"],
                    "is_support": getMe["is_support"],
                    "is_scam": getMe["is_scam"],
                    "is_fake": getMe["is_fake"],
                    "have_acces": getMe["have_access"]
                };
                return { "ok": true, "result": json };
            } else {
                return { "ok": false, "result": getMe };
            }
        }

        if (RegExp(`^getUser$`, "i").exec(method)) {
            var getUser = await this.getUser(option["chat_id"]);
            if (new RegExp("^user$", "i").exec(getUser["_"])) {
                var json = {}
                json["id"] = Number(getUser["id"])
                try {
                    if (new RegExp("^userTypeBot$", "i").exec(getUser["type"]["_"])) {
                        json["is_bot"] = true
                    } else {
                        json["is_bot"] = false
                    }
                } catch (e) {
                    json["is_bot"] = false
                }
                json["first_name"] = getUser["first_name"];
                if (getUser["last_name"]) {
                    json["last_name"] = getUser["last_name"];
                }
                if (getUser["username"]) {
                    json["username"] = getUser["username"];
                }
                if (getUser["phone_number"]) {
                    json["phone_number"] = Number(getUser["phone_number"]);
                }
                if (getUser["status"]["_"]) {
                    json["status"] = String(getUser["status"]["_"]).replace(/(userStatus)/ig, "").toLocaleLowerCase();
                }
                json["type"] = "private";
                if (getUser["language_code"]) {
                    json["language_code"] = getUser["language_code"];
                }
                try {
                    var getUserFullInfo = await this.getUserFullInfo(option["chat_id"]);
                    if (typeof getUserFullInfo == "object") {
                        if (getUserFullInfo["bio"]) {
                            json["bio"] = getUserFullInfo["bio"];
                        }
                        if (typeof getUserFullInfo["photo"] == "object" && getUserFullInfo["photo"].length > 0) {
                            json["profile_photo"] = getUserFullInfo["photo"][getUserFullInfo["photo"].length - 1]["file_id"];
                        }
                    }
                } catch (e) {

                }
                json["detail"] = {
                    "is_contact": getUser["is_contact"],
                    "is_mutual_contact": getUser["is_mutual_contact"],
                    "is_verified": getUser["is_verified"],
                    "is_support": getUser["is_support"],
                    "is_scam": getUser["is_scam"],
                    "is_fake": getUser["is_fake"],
                    "have_acces": getUser["have_access"]
                };
                return { "ok": true, "result": json };
            } else {
                return { "ok": false, "result": getUser };
            }
        }
        if (new RegExp(`^getChat$`, "i").exec(method)) {
            var getchat = await this.getChat(option["chat_id"]);
            if (getchat && RegExp("^chat$", "i").exec(getchat["_"])) {
                var type_chat = String(getchat["type"]["_"]).toLocaleLowerCase().replace(/(chattype)/ig, "");
                var json = {};
                if (getchat["type"]["is_channel"]) {
                    var getSupergroup = await this.getSupergroup(option["chat_id"]);
                    var json = {};
                    json["id"] = Number(option["chat_id"]);
                    json["title"] = getchat["title"];
                    if (getSupergroup["username"]) {
                        json["username"] = getSupergroup["username"];
                    }
                    if (getSupergroup["status"]) {
                        json["status"] = String(getSupergroup["status"]["_"]).replace(/(chatMemberStatus)/ig, "").toLocaleLowerCase();
                    }
                    json["type"] = "channel";
                    json["detail"] = {
                        "member_count": getSupergroup["member_count"],
                        "administrator_count": 0,
                        "restricted_count": 0,
                        "banned_count": 0,
                        "has_linked_chat": getSupergroup["has_linked_chat"],
                        "has_location": getSupergroup["has_location"],
                        "sign_messages": getSupergroup["sign_messages"],
                        "is_slow_mode_enabled": getSupergroup["is_slow_mode_enabled"],
                        "is_broadcast_group": getSupergroup["is_broadcast_group"],
                        "is_verified": getSupergroup["is_verified"],
                        "is_scam": getSupergroup["is_scam"],
                        "is_fake": getSupergroup["is_fake"]
                    };

                    try {
                        var getSupergroupFullInfo = await this.getSupergroupFullInfo(option["chat_id"]);
                        json["detail"]["member_count"] = getSupergroupFullInfo["member_count"];
                        json["detail"]["administrator_count"] = getSupergroupFullInfo["administrator_count"];
                        json["detail"]["restricted_count"] = getSupergroupFullInfo["restricted_count"];
                        json["detail"]["banned_count"] = getSupergroupFullInfo["banned_count"];
                        if (typeof getSupergroupFullInfo["photo"] == "object" && typeof getSupergroupFullInfo["photo"]["sizes"] == "object" && getSupergroupFullInfo["photo"]["sizes"].length > 0) {
                            var getSupergroupPhotos = getSupergroupFullInfo["photo"]["sizes"];
                            json["profile_photo"] = getSupergroupPhotos[getSupergroupPhotos.length - 1]["photo"]["remote"]["id"];
                        }
                    } catch (e) {

                    }
                    return { ok: true, result: json };
                } else if (RegExp("supergroup", "i").exec(type_chat)) {
                    var getSupergroup = await this.getSupergroup(option["chat_id"]);
                    var json = {};
                    json["id"] = Number(option["chat_id"]);
                    json["title"] = getchat["title"];
                    if (getSupergroup["username"]) {
                        json["username"] = getSupergroup["username"];
                    }
                    if (getSupergroup["status"]) {
                        json["status"] = String(getSupergroup["status"]["_"]).replace(/(chatMemberStatus)/ig, "").toLocaleLowerCase();
                    }
                    json["type"] = "supergroup";
                    json["detail"] = {
                        "member_count": getSupergroup["member_count"],
                        "administrator_count": 0,
                        "restricted_count": 0,
                        "banned_count": 0,
                        "has_linked_chat": getSupergroup["has_linked_chat"],
                        "has_location": getSupergroup["has_location"],
                        "sign_messages": getSupergroup["sign_messages"],
                        "is_slow_mode_enabled": getSupergroup["is_slow_mode_enabled"],
                        "is_broadcast_group": getSupergroup["is_broadcast_group"],
                        "is_verified": getSupergroup["is_verified"],
                        "is_scam": getSupergroup["is_scam"],
                        "is_fake": getSupergroup["is_fake"]
                    };
                    try {
                        var getSupergroupFullInfo = await this.getSupergroupFullInfo(option["chat_id"]);
                        json["detail"]["member_count"] = getSupergroupFullInfo["member_count"];
                        json["detail"]["administrator_count"] = getSupergroupFullInfo["administrator_count"];
                        json["detail"]["restricted_count"] = getSupergroupFullInfo["restricted_count"];
                        json["detail"]["banned_count"] = getSupergroupFullInfo["banned_count"];
                        if (typeof getSupergroupFullInfo["photo"] == "object" && typeof getSupergroupFullInfo["photo"]["sizes"] == "object" && getSupergroupFullInfo["photo"]["sizes"].length > 0) {
                            var getSupergroupPhotos = getSupergroupFullInfo["photo"]["sizes"];
                            json["profile_photo"] = getSupergroupPhotos[getSupergroupPhotos.length - 1]["photo"]["remote"]["id"];
                        }
                    } catch (e) {

                    }
                    return { ok: true, result: json };
                } else if (RegExp("BasicGroup", "i").exec(type_chat)) {
                    var getBasicGroup = await this.getBasicGroup(option["chat_id"]);
                    var json = {};
                    json["id"] = Number(option["chat_id"]);
                    json["title"] = getchat["title"];
                    if (getBasicGroup["status"]) {
                        json["status"] = String(getBasicGroup["status"]["_"]).replace(/(chatMemberStatus)/ig, "").toLocaleLowerCase();
                    }
                    json["type"] = "group";
                    try {
                        var getBasicGroupFullInfo = await this.getBasicGroupFullInfo(option["chat_id"]);
                        if (typeof getBasicGroupFullInfo["photo"] == "object" && typeof getBasicGroupFullInfo["photo"]["sizes"] == "object" && getBasicGroupFullInfo["photo"]["sizes"].length > 0) {
                            var getBasicGroupPhotos = getBasicGroupFullInfo["photo"]["sizes"];
                            json["profile_photo"] = getBasicGroupPhotos[getBasicGroupPhotos.length - 1]["photo"]["remote"]["id"];
                        }
                    } catch (e) {

                    }
                    json["detail"] = {
                        "member_count": getBasicGroup["member_count"]
                    };
                    return { ok: true, result: json };
                } else if (RegExp("private", "i").exec(type_chat)) {
                    var getUser = await this.getUser(option["chat_id"]);
                    if (new RegExp("^user$", "i").exec(getUser["_"])) {
                        var json = {}
                        json["id"] = Number(getUser["id"])
                        try {
                            if (new RegExp("^userTypeBot$", "i").exec(getUser["type"]["_"])) {
                                json["is_bot"] = true
                            } else {
                                json["is_bot"] = false
                            }
                        } catch (e) {
                            json["is_bot"] = false
                        }
                        json["first_name"] = getUser["first_name"]
                        if (getUser["last_name"]) {
                            json["last_name"] = getUser["last_name"]
                        }
                        if (getUser["username"]) {
                            json["username"] = getUser["username"]
                        }
                        if (getUser["phone_number"]) {
                            json["phone_number"] = Number(getUser["phone_number"])
                        }
                        if (getUser["status"]["_"]) {
                            json["status"] = String(getUser["status"]["_"]).replace(/(userStatus)/ig, "").toLocaleLowerCase();
                        }
                        json["type"] = "private";
                        if (getUser["language_code"]) {
                            json["language_code"] = getUser["language_code"]
                        }

                        try {
                            var getUserFullInfo = await this.getUserFullInfo(option["chat_id"]);
                            if (typeof getUserFullInfo == "object") {
                                if (getUserFullInfo["bio"]) {
                                    json["bio"] = getUserFullInfo["bio"];
                                }
                                if (typeof getUserFullInfo["photo"] == "object" && getUserFullInfo["photo"].length > 0) {
                                    json["profile_photo"] = getUserFullInfo["photo"][getUserFullInfo["photo"].length - 1]["file_id"];
                                }
                            }
                        } catch (e) {

                        }

                        json["detail"] = {
                            "is_contact": getUser["is_contact"],
                            "is_mutual_contact": getUser["is_mutual_contact"],
                            "is_verified": getUser["is_verified"],
                            "is_support": getUser["is_support"],
                            "is_scam": getUser["is_scam"],
                            "is_fake": getUser["is_fake"],
                            "have_acces": getUser["have_access"]
                        };
                        return { "ok": true, "result": json };
                    } else {
                        return { "ok": false, "result": getUser };
                    }
                } else {
                    console.log(JSON.stringify(type_chat, null, 2))
                    return { "ok": false };
                }

            }
        }
    }

    async acceptCall(call_id, udp_p2p, udp_reflector, min_layer, max_layer, library_versions) {
        var data = {
            '_': "acceptCall",
            "call_id": call_id,
            "protocol": {
                udp_p2p: udp_p2p,
                udp_reflector: udp_reflector,
                min_layer: min_layer,
                max_layer: max_layer,
                library_versions: library_versions
            }
        }
        return await this.client.invoke(data);
    }

    async acceptTermsOfService(terms_of_service_id) {
        var data = {
            '_': "acceptTermsOfService",
            terms_of_service_id: terms_of_service_id
        };
        return await this.client.invoke(data);
    }
    async addChatMember(chat_id, user_id, forward_limit) {
        var typeChat = await this.typeChat_Id(chat_id);
        var data = {
            '_': "addChatMember",
            "chat_id": typeChat,
            "user_id": user_id
        };
        if (forward_limit) {
            data["forward_limit"] = forward_limit;
        }
        return await this.client.invoke(data);
    }
    async addChatMembers(chat_id, user_ids) {
        var typeChat = await this.typeChat_Id(chat_id);
        var data = {
            '_': "addChatMembers",
            "chat_id": typeChat,
            "user_ids": user_ids
        }
        return await this.client.invoke(data)
    }
    /*
    async addChatToList(chat_id, user_ids) {
        var typeChat = await this.typeChat_Id(chat_id)
        var data = {
            '_': "addChatMembers",
            chat_id: typeChat,
            chat_list: {

            }
        }
        return this.client.invoke(data)
    }*/

    async addContact(user_id, first_name, last_name = "", phone_number = "", vcard = "", share_phone_number = false) {

        var data = {
            '_': "addContact",
            "contact": {
                "phone_number": phone_number,
                "first_name": first_name,
                "last_name": last_name,
                "vcard": vcard,
                "user_id": user_id
            },
            "share_phone_number": share_phone_number
        };
        return await this.client.invoke(data);
    }
    parseMode(text, parse_mode, entities) {
        var pesan = { "text": text };
        var parseMode = 'textParseModeHTML'
        if (typeof parse_mode == "string") {
            parse_mode = parse_mode.toLowerCase();
            if (parse_mode == 'markdown') {
                parseMode = 'textParseModeMarkdown'
            } else if (parse_mode == 'html') {
                parseMode = 'textParseModeHTML';
            } else {
                parse_mode = false;
            }
        }

        if (typeof parse_mode == "string") {
            pesan = this.client.execute({
                "_": 'parseTextEntities',
                "parse_mode": { "_": parseMode },
                "text": text
            });
        }

        if (entities) {
            pesan = {
                _: 'formattedText',
                text: text,
                entities: entities
            };
        }
        return pesan;
    }


    async invoke(method, parameters = {}) {
        if (typeof method != "string") {
            throw {
                "message": "method false"
            };
        }
        if (typeof parameters != "object") {
            throw {
                "message": "parameters false"
            };
        }
        delete parameters["_"];
        var option = {
            "_": method,
            ...parameters
        };
        return await this.client.invoke(option);
    }

    typeFile(content) {

        var data = {}

        if (/^http/i.exec(content)) {
            data = {
                '_': 'inputFileRemote',
                id: content
            };
        } else if (/^(\/|\.\.?\/|~\/)/i.exec(content)) { // deteksi : awal / atau ./ ../ atau ~/
            data = {
                '_': 'inputFileLocal',
                path: content
            };
        } else if (typeof content === 'number') {
            data = {
                '_': 'inputFileId',
                id: content
            };
        } else {
            data = {
                '_': 'inputFileRemote',
                id: content
            };

            // mode blob belum aku masukkan, butuh waktu buat coba-coba
        }

        return data;

    }
    async getCallbackQueryAnswer(chat_id, message_id, data) {
        var option = {
            "_": "getCallbackQueryAnswer",
            "chat_id": chat_id,
            "message_id": message_id,
            "payload": {
                "_": "callbackQueryPayloadData",
                "data": Buffer.from(data).toString('base64')
            }
        };
        return await this.client.invoke(option);
    }
    async createPrivateChat(user_id, force = false) {
        var option = {
            "_": "createPrivateChat",
            "user_id": user_id,
            "force": force
        };
        return await this.client.invoke(option);
    }
    async sendBotStartMessage(chat_id, bot_user_id, parameter) {
        var option = {
            "_": "sendBotStartMessage",
            "bot_user_id": bot_user_id,
            "chat_id": chat_id
        };
        if (parameter) {
            option["parameter"] = parameter;
        }
        return await this.client.invoke(option);
    }
    async deleteMessage(chat_id, message_id, revoke = true) {
        message_id = message_id.constructor === Array ? message_id : [message_id]
        var data = {
            '_': "deleteMessages",
            "chat_id": chat_id,
            "message_ids": message_id,
            "revoke": revoke
        };
        return await this.client.invoke(data);
    }
    // fungsi seperti Bot API

    async getMe() {
        return await this.client.invoke({ _: 'getMe' })
    }

    async getMessageLocally(chat_id, message_id) {
        var data = {
            '_': "getMessageLocally",
            chat_id: chat_id,
            message_id: message_id
        };
        return await this.client.invoke(data)
    }

    async requestSendMessage(parameters) {
        var sendMessage = await this.invoke("sendMessage", parameters);
        if (this.on_update) {
            var request = this;
            var value = {
                "status_code": 200,
                "status_bool": true,
                "result": {}
            };
            await timers.setTimeout(1000, request.client.addListener("update", async function (update) {
                if (typeof update == "object") {
                    if (update["_"] == "updateMessageSendSucceeded") {
                        try {
                            var result = await request.request("getMessage", {
                                "chat_id": update["message"]["chat_id"],
                                "message_id": update["message"]["id"]
                            });
                            return value["result"] = result["message"];
                        } catch (e) {
                            value["status_code"] = 500;
                            value["status_bool"] = false;
                            return value["result"] = {}
                        }
                    } else {
                        value["status_code"] = 400;
                        value["status_bool"] = false;
                        return value["result"] = update;
                    }
                } else {
                    value["status_code"] = 405;
                    value["status_bool"] = false;
                    return value["result"] = {}
                }
            }));
            return value;
        } else {
            return sendMessage;
        }
    }

    async sendMessage(chat_id, text, parse_mode = false, entities = false, disable_web_page_preview = false, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        var pesan = this.parseMode(text, parse_mode, entities);
        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {}
        };
        if (disable_notification) {
            data["disable_notification"] = disable_notification;
        }
        if (reply_to_message_id) {
            data["reply_to_message_id"] = reply_to_message_id;
        }
        if (reply_markup) {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        data["input_message_content"] = {
            '_': "inputMessageText",
            "text": pesan,
            "disable_web_page_preview": disable_web_page_preview,
            "clear_draft": false
        };
        return await this.requestSendMessage(data);
    }


    async editMessageText(chat_id, message_id, text, parse_mode = false, entities = false, disable_web_page_preview = false, reply_markup = false) {
        var pesan = this.parseMode(text, parse_mode, entities);
        var data = {
            '_': "editMessageText",
            "chat_id": chat_id,
            "message_id": message_id,
            "input_message_content": {}
        };
        if (reply_markup) {
            data["reply_markup"] = this.reply_markup(reply_markup)
        }
        data["input_message_content"] = {
            '_': "inputMessageText",
            "text": pesan,
            "disable_web_page_preview": disable_web_page_preview,
            "clear_draft": false
        };
        return await this.client.invoke(data);
    }
    async editMessageReplyMarkup(chat_id, message_id, reply_markup = false) {
        var data = {
            '_': "editMessageReplyMarkup",
            "chat_id": chat_id,
            "message_id": message_id
        };
        if (typeof reply_markup == "object") {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        return await this.client.invoke(data);
    }

    reply_markup(keyboard) {
        try {
            if (keyboard["inline_keyboard"].length > 0) {
                var json = { "_": "replyMarkupInlineKeyboard" }
                var array_rows = []
                for (var i = 0; i < keyboard["inline_keyboard"].length; i++) {
                    var loop_array_keyboard = keyboard["inline_keyboard"][i]
                    var array_loop = []
                    for (var ii = 0; ii < loop_array_keyboard.length; ii++) {
                        var in_loop_array_keyboard = loop_array_keyboard[ii]
                        var in_json_keyboard = { "_": "inlineKeyboardButton" }
                        if (in_loop_array_keyboard["text"]) {
                            in_json_keyboard["text"] = in_loop_array_keyboard["text"];
                        }

                        if (in_loop_array_keyboard["url"]) {
                            in_json_keyboard["type"] = {
                                "_": "inlineKeyboardButtonTypeUrl",
                                "url": in_loop_array_keyboard["url"]
                            };
                        }

                        if (in_loop_array_keyboard["callback_data"]) {
                            in_json_keyboard["type"] = {
                                "_": "inlineKeyboardButtonTypeCallback",
                                "data": Buffer.from(in_loop_array_keyboard["callback_data"]).toString('base64')
                            };
                        }
                        array_loop.push(in_json_keyboard);
                    }
                    array_rows.push(array_loop);
                }
                json.rows = array_rows;
                return json;
            }

        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async sendChatAction(chat_id, type = 'typing') {
        var action = 'chatActionTyping';
        switch (type.toLowerCase()) {
            case 'cancel':
                action = 'chatActionCancel';
                break;
            case 'contact':
                action = 'chatActionChoosingContact';
                break;
            case 'location':
                action = 'chatActionChoosingLocation';
                break;
            case 'sticker':
                action = 'chatActionChoosingSticker';
                break;
            case 'record_video':
                action = 'chatActionRecordingVideo';
                break;
            case 'record_video_note':
                action = 'chatActionRecordingVideoNote';
                break;
            case 'record_voice':
                action = 'chatActionRecordingVoiceNote';
                break;
            case 'game':
                action = 'chatActionStartPlayingGame';
                break;
            case 'typing':
                action = 'chatActionTyping';
                break;
            case 'upload_document':
                action = 'chatActionUploadingDocument';
                break;
            case 'upload_photo':
                action = 'chatActionUploadingPhoto';
                break;
            case 'upload_video':
                action = 'chatActionUploadingVideo';
                break;
            case 'upload_video_note':
                action = 'chatActionUploadingVideoNote';
                break;
            case 'upload_voice':
                action = 'chatActionUploadingVoiceNote';
                break;
            case 'watch_animation':
                action = 'chatActionWatchingAnimations';
                break;
            default:
                action = 'chatActionTyping'
                break;
        }

        return await this.client.invoke({
            '_': "sendChatAction",
            "chat_id": chat_id,
            'action': {
                '_': action
            }
        });

    }

    async getMessage(chat_id, message_id) {
        return await this.client.invoke({
            '_': "getMessage",
            "chat_id": chat_id,
            "message_id": message_id
        });
    }

    async forwardMessage(chat_id, from_chat_id, message_id, send_copy = true, reply_markup) {
        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {
                '_': "inputMessageForwarded",
                "from_chat_id": from_chat_id,
                "message_id": message_id,
                "copy_options": {
                    '_': "messageCopyOptions",
                    "send_copy": send_copy
                }
            }
        };
        if (reply_markup) {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        return await this.requestSendMessage(data);
    }

    async copyMessage(chat_id, from_chat_id, message_id, new_caption = false, parse_mode = "html", entities = false, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "options": {},
            "input_message_content": {
                '_': "inputMessageForwarded",
                "from_chat_id": from_chat_id,
                "message_id": message_id,
                "copy_options": {
                    '_': "messageCopyOptions",
                    "send_copy": true
                }
            }
        };
        if (new_caption) {
            var pesan = this.parseMode(new_caption, parse_mode, entities);
            data["input_message_content"]["copy_options"]["replace_caption"] = true;
            data["input_message_content"]["copy_options"]["new_caption"] = pesan;
        }
        if (disable_notification) {
            data["options"]["disable_notification"] = disable_notification;
        }
        if (reply_to_message_id) {
            data["reply_to_message_id"] = reply_to_message_id;
        }
        if (reply_markup) {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        return await this.requestSendMessage(data);
    }


    async pinChatMessage(chat_id, message_id, disable_notification = false, only_for_self = false) {
        var data = {
            '_': "pinChatMessage",
            "chat_id": chat_id,
            "message_id": message_id
        };

        if (disable_notification) {
            data["disable_notification"] = disable_notification;
        }

        if (only_for_self) {
            data["only_for_self"] = only_for_self;
        }

        return await this.client.invoke(data);
    }

    async unpinChatMessage(chat_id, message_id) {
        var data = {
            '_': "unpinChatMessage",
            "chat_id": chat_id,
            "message_id": message_id
        };
        return await this.client.invoke(data)
    }

    async unpinAllMessages(chat_id) {
        var data = {
            '_': "unpinAllMessages",
            "chat_id": chat_id
        };
        return await this.client.invoke(data);
    }

    async getUser(user_id) {
        var data = {
            '_': "getUser",
            "user_id": user_id
        };
        return await this.client.invoke(data);
    }

    async custom(Method, parameters) {
        var data = {
            '_': "sendCustomRequest",
            "method": Method,
            "parameters": parameters
        };
        return await this.client.invoke(data);
    }

    async getBlockedMessageSenders(offset, limit = 50) {
        var data = {
            '_': "getBlockedMessageSenders",
            "offest": offset,
            "limit": limit
        };
        return await this.client.invoke(data);
    }

    async getAllBlockMessageSender() {
        var limit = 40;
        var total_count = 0;
        var getBlockedMessageSenders = await this.client.invoke({
            '_': "getBlockedMessageSenders",
            "offest": 0,
            "limit": limit
        });
        total_count = getBlockedMessageSenders["total_count"];
        var list_user = [];
        list_user = getBlockedMessageSenders["senders"];
        var start_offset = limit;
        for (let index = 0; index < (total_count / limit); index++) {
            if (index > 0) {
                await timers.setTimeout(2000);
                var getBlockedMessageSender = await this.client.invoke({
                    '_': "getBlockedMessageSenders",
                    "offest": start_offset,
                    "limit": limit
                });
                await timers.setTimeout(2000);
                for (var i = 0; i < getBlockedMessageSender["senders"].length; i++) {
                    list_user.push(getBlockedMessageSender["senders"][i]);
                }
                start_offset = (start_offset + limit);
            }
        }
        return { "ok": true, "result": list_user };
    }

    async getUserFullInfo(user_id, nau = false) {
        var param = {
            '_': "getUserFullInfo",
            "user_id": user_id
        };
        var data = await this.client.invoke(param);
        if (nau) {
            return data;
        }
        try {
            if (new RegExp("^userFullInfo$", "i").exec(data["_"])) {
                if (new RegExp("^chatPhoto$", "i").exec(data["photo"]["_"])) {
                    if (data["photo"]["sizes"].length > 0) {
                        var json = {}
                        var size_photo = []
                        var photo = data["photo"]["sizes"];
                        for (var i = 0; i < photo.length; i++) {
                            var photo_json = photo[i]
                            var json_photo = {}
                            if (new RegExp("^remoteFile$", "i").exec(photo_json["photo"]["remote"]["_"])) {
                                json_photo["file_id"] = photo_json["photo"]["remote"]["id"];
                            }
                            if (photo_json["photo"]["remote"]["unique_id"]) {
                                json_photo["file_unique_id"] = photo_json["photo"]["remote"]["unique_id"];
                            }
                            json_photo["file_size"] = photo_json["photo"]["size"];
                            json_photo["width"] = photo_json["width"];
                            json_photo["height"] = photo_json["height"];

                            size_photo.push(json_photo);
                        }
                        json["photo"] = size_photo
                        json["bio"] = data["bio"];
                        return json;
                    }
                }
            } else {
                return data;
            }
        } catch (e) {
            var json = {}
            json.photo = []
            json.bio = false
            return json
        }
    }
    async getUserProfilePhotos(user_id, offset = 0, limit = 1) {
        var data = {
            '_': "getUserProfilePhotos",
            "user_id": user_id,
            "offset": offset,
            "limit": limit
        };
        return await this.client.invoke(data)
    }

    async searchChatsOnServer(query, limit = 1) {
        var data = {
            '_': "searchChatsOnServer",
            'query': query,
            "limit": limit
        };
        return await this.client.invoke(data)
    }
    async searchPublicChat(username) {
        var data = {
            '_': "searchPublicChat",
            'username': username
        };
        return await this.client.invoke(data)
    }
    async searchPublicChats(query = "") {
        var data = {
            '_': "searchPublicChats",
            'query': query
        };
        return await this.client.invoke(data)
    }

    async sendPhoto(chat_id, photo, caption = false, parse_mode = false, caption_entities = false, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        // { '_': 'inputFileBlob', name: file.name, size: file.size, data: file },
        var detailData = this.typeFile(photo)

        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {}
        };
        if (typeof disable_notification == "boolean") {
            data["disable_notification"] = disable_notification;
        }

        if (typeof reply_to_message_id == "number") {
            data["reply_to_message_id"] = reply_to_message_id;
        }
        if (typeof reply_markup == "object") {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        data["input_message_content"] = {
            '_': "inputMessagePhoto",
            "photo": detailData,
        };
        if (typeof caption == "string") {
            var text = this.parseMode(caption, parse_mode, caption_entities);
            data["input_message_content"]["caption"] = text;
        }

        return await this.requestSendMessage(data);
    }

    async sendDocument(chat_id, document, caption = false, parse_mode = false, caption_entities = false, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        // { '_': 'inputFileBlob', name: file.name, size: file.size, data: file },
        var detailData = this.typeFile(document)

        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {}
        };

        if (typeof disable_notification == "boolean") {
            data["disable_notification"] = disable_notification;
        }

        if (typeof reply_to_message_id == "number") {
            data["reply_to_message_id"] = reply_to_message_id;
        }
        if (typeof reply_markup == "object") {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        data["input_message_content"] = {
            '_': "inputMessageDocument",
            "document": detailData,
        };

        if (caption) {
            var text = this.parseMode(caption, parse_mode, caption_entities);
            data["input_message_content"]["caption"] = text;
        }

        return await this.requestSendMessage(data);
    }

    async sendVideo(chat_id, video, caption = false, parse_mode = false, caption_entities = false, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        // { '_': 'inputFileBlob', name: file.name, size: file.size, data: file },
        var detailData = this.typeFile(video)

        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {}
        };

        if (typeof disable_notification == "boolean") {
            data["disable_notification"] = disable_notification;
        }

        if (typeof reply_to_message_id == "number") {
            data["reply_to_message_id"] = reply_to_message_id;
        }
        if (typeof reply_markup == "object") {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        data["input_message_content"] = {
            '_': "inputMessageVideo",
            "video": detailData,
        };

        if (caption) {
            var text = this.parseMode(caption, parse_mode, caption_entities);
            data["input_message_content"]["caption"] = text;
        }
        return await this.requestSendMessage(data);
    }

    async sendAudio(chat_id, audio, caption = false, parse_mode = false, caption_entities = false, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        // { '_': 'inputFileBlob', name: file.name, size: file.size, data: file },
        var detailData = this.typeFile(audio);

        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {}
        };


        if (typeof disable_notification == "boolean") {
            data["disable_notification"] = disable_notification;
        }

        if (typeof reply_to_message_id == "number") {
            data["reply_to_message_id"] = reply_to_message_id;
        }
        if (typeof reply_markup == "object") {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }

        data["input_message_content"] = {
            '_': "inputMessageAudio",
            "audio": detailData,
        };

        if (caption) {
            var text = this.parseMode(caption, parse_mode, caption_entities);
            data["input_message_content"]["caption"] = text;
        }

        return await this.requestSendMessage(data);
    }

    async sendVoice(chat_id, voice, caption = false, parse_mode = false, caption_entities = false, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        // { '_': 'inputFileBlob', name: file.name, size: file.size, data: file },
        var detailData = this.typeFile(voice);

        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {}
        };


        if (typeof disable_notification == "boolean") {
            data["disable_notification"] = disable_notification;
        }

        if (typeof reply_to_message_id == "number") {
            data["reply_to_message_id"] = reply_to_message_id;
        }
        if (typeof reply_markup == "object") {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }

        data["input_message_content"] = {
            '_': "inputMessageVoiceNote",
            "voice_note": detailData,
        };


        if (caption) {
            var text = this.parseMode(caption, parse_mode, caption_entities);
            data["input_message_content"]["caption"] = text;
        }

        return await this.requestSendMessage(data);
    }

    async sendSticker(chat_id, sticker, disable_notification = false, reply_to_message_id = false, reply_markup = false) {
        // { '_': 'inputFileBlob', name: file.name, size: file.size, data: file },
        var detailData = this.typeFile(sticker)

        var data = {
            '_': "sendMessage",
            "chat_id": chat_id,
            "input_message_content": {}
        };

        if (typeof disable_notification == "boolean") {
            data["disable_notification"] = disable_notification;
        }

        if (typeof reply_to_message_id == "number") {
            data["reply_to_message_id"] = reply_to_message_id;
        }

        data["input_message_content"] = {
            '_': "inputMessageSticker",
            "sticker": detailData,
        };
        if (typeof reply_markup == "object") {
            data["reply_markup"] = this.reply_markup(reply_markup);
        }
        return await this.requestSendMessage(data);
    }

    async answerCallbackQuery(callback_query_id, text = false, show_alert = false, url = false, cache_time = false) {
        var data = {
            '_': "answerCallbackQuery",
            "callback_query_id": callback_query_id
        };
        if (text) {
            data["text"] = text;
        }
        if (show_alert) {
            data["show_alert"] = show_alert;
        }
        if (url) {
            data["url"] = url;
        }
        if (cache_time) {
            data["cache_time"] = cache_time;
        }
        return await this.client.invoke(data);
    }

    // userbot

    async searchPublicChats(query) {
        var data = {
            '_': "searchPublicChats",
            "query": query
        };
        return await this.client.invoke(data);
    }

    async viewMessages(chat_id, message_id, force_read = false) {
        message_id = message_id.constructor === Array ? message_id : [message_id]
        var data = {
            '_': "viewMessages",
            "chat_id": chat_id,
            "message_ids": message_id
        };

        if (typeof force_read == "boolean") {
            data["force_read"] = force_read;
        }

        return await this.client.invoke(data);
    }

    async getChatStatistics(chat_id) {
        var data = {
            '_': "getChatStatistics",
            "chat_id": chat_id
        };
        return await this.client.invoke(data);
    }

    async getChats(limit = 4000) {
        return await this.client.invoke({
            '_': 'getChats',
            "chat_list": {
                "_": 'chatListMain'
            },
            "limit": limit
        });
    }

    // Returns information about a chat by its identifier, this is an offline request if the current user is not a bot.
    async getChat(chat_id) {
        var data = {
            '_': "getChat",
            "chat_id": Number(chat_id)
        };
        return await this.client.invoke(data);
    }

    async getBasicGroup(chat_id) {
        var chat_id = String(chat_id).replace(/(-100|-)/ig, "");
        var data = {
            '_': "getBasicGroup",
            "basic_group_id": Number(chat_id)
        };
        return await this.client.invoke(data);
    }


    async getBasicGroupFullInfo(chat_id) {
        var chat_id = String(chat_id).replace(/(-100|-)/ig, "");
        var data = {
            '_': "getBasicGroupFullInfo",
            "basic_group_id": Number(chat_id)
        };
        return await this.client.invoke(data);
    }
    async getChatAdministrators(chat_id) {
        var json_respond = {
            "status_bool": true,
            "status_code": 200,
            "result": {}
        };
        var data = {
            '_': "getChatAdministrators",
            "chat_id": chat_id
        };
        var getChatAdministrators = await this.client.invoke(data);
        if (typeof getChatAdministrators != "object") {
            json_respond["status_bool"] = false;
            json_respond["status_code"] = 400;
            return json_respond;
        }
        if (getChatAdministrators["_"] == "chatAdministrators") {
            if (typeof getChatAdministrators["administrators"] != "object") {
                json_respond["status_bool"] = false;
                json_respond["status_code"] = 404;
                return json_respond;
            }
            var array_list_admin = [];
            for (var i = 0; i < getChatAdministrators["administrators"].length; i++) {
                var loop_data = getChatAdministrators["administrators"][i];
                if (typeof loop_data == "object") {
                    if (loop_data["_"] == "chatAdministrator") {
                        var json_data = {};
                        try {
                            var getChat = await this.request("getChat", {
                                "chat_id": loop_data["user_id"]
                            });
                            json_data["user"] = getChat["result"];
                            json_data["is_owner"] = loop_data["is_owner"];
                            json_data["status"] = loop_data["is_owner"] ? "creator" : "administrator";
                            json_data["custom_title"] = loop_data["custom_title"];
                            array_list_admin.push(json_data);
                        } catch (e) {

                        }
                    }
                }
            }
            json_respond["result"] = array_list_admin;
            return json_respond;
        }
    }

    async promoteChatMember(chat_id, user_id, options) {
        var data = {
            '_': "setChatMemberStatus",
            "chat_id": chat_id,
            "member_id": {
                "_": "messageSenderUser",
                "user_id": user_id
            },
            "status": {
                "_": "chatMemberStatusAdministrator",
                "custom_title": "Admins"
            }
        };
        if (typeof options == "boolean") {
            var status = {
                "_": "chatMemberStatusAdministrator",
                "custom_title": "Admins"
            };
            for (var key in options) {
                if (Object.hasOwnProperty.call(options, key)) {
                    var loop_data = options[key];
                    if (typeof loop_data == "boolean") {
                        status[String(key).toLocaleLowerCase()] = loop_data;
                    }
                }
            }
            data["status"] = status;
        }
        return await this.client.invoke(data);
    }
    async setChatMemberStatus(chat_id, user_id, status = "ban", banned_until_date = 0) {
        var data = {
            '_': "setChatMemberStatus",
            "chat_id": chat_id,
            "member_id": {
                "_": "messageSenderUser",
                "user_id": user_id
            },
            "status": {
                "_": "chatMemberStatusBanned",
                "banned_until_date": banned_until_date
            }
        };
        return await this.client.invoke(data);
    }

    async banChatMember(chat_id, user_id, banned_until_date = 0, revoke_messages = false) {
        var data = {
            '_': "banChatMember",
            "chat_id": chat_id,
            "member_id": {
                "_": "messageSenderUser",
                "user_id": user_id
            }
        };
        if (typeof banned_until_date == "number") {
            data["banned_until_date"] = banned_until_date;
        }
        if (typeof revoke_messages == "boolean") {
            data["revoke_messages"] = revoke_messages;
        }
        return await this.client.invoke(data);
    }

    async banChatSenderChat(chat_id, sender_chat_id, banned_until_date = 0, revoke_messages = false) {
        var data = {
            '_': "getChatMember",
            "chat_id": chat_id,
            "member_id": {
                "_": "messageSenderChat",
                "chat_id": sender_chat_id
            }
        };
        if (typeof banned_until_date == "number") {
            data["banned_until_date"] = banned_until_date;
        }
        if (typeof revoke_messages == "boolean") {
            data["revoke_messages"] = revoke_messages;
        }
        return await this.client.invoke(data);
    }

    async getChatMember(chat_id, user_id) {
        var data = {
            '_': "getChatMember",
            "chat_id": chat_id,
            "member_id": {
                "_": "messageSenderUser",
                "user_id": user_id
            }
        };
        return await this.client.invoke(data);
    }
    async getChatList() {
        var { chat_ids } = await this.getChats()

        const chats = [];
        for (const chat_id of chat_ids) {
            const chat = await this.request("getChat", { chat_id: chat_id })
            if (chat.ok) {
                chats.push(chat.result);
            }
        }
        if (chats.length > 0) {
            return { oke: true, result: chats };
        } else {
            return { ok: false };
        }
    }

    async destroy() {
        var data = {
            '_': "destroy"
        };
        return await this.client.invoke(data)
    }

    async joinChat(chat_id) {
        return await this.client.invoke({
            '_': 'joinChat',
            "chat_id": chat_id
        });
    }

    async joinChatByInviteLink(link) {
        return await this.client.invoke({
            '_': 'joinChatByInviteLink',
            "invite_link": link
        });
    }

    async leaveChat(chat_id) {
        return await this.client.invoke({
            '_': "leaveChat",
            "chat_id": chat_id
        });
    }

    async setBio(bio) {
        return await this.client.invoke({
            '_': "setBio",
            "bio": bio
        });
    }

    async setUsername(username) {
        return await this.client.invoke({
            '_': "setUsername",
            "username": username
        });
    }

    async getChatHistory(chat_id, from_message_id, offset, limit, only_local = false) {
        return await this.client.invoke({
            '_': "getChatHistory",
            "chat_id": chat_id,
            "from_message_id": from_message_id,
            "offset": offset,
            "limit": limit,
            "only_local": only_local
        });
    }

    async getFile(file_id) {
        return await this.client.invoke({
            '_': "getFile",
            "file_id": file_id
        });
    }

    async createCall(user_id, is_video) {
        return await this.client.invoke({
            '_': "createCall",
            'user_id': user_id,
            'protocol': {
                '_': 'callProtocol',
                'udp_p2p': true,
                'udp_reflector': true,
                'min_layer': 65,
                'max_layer': 65,
            },
            'is_video': is_video
        })
    }
    async getSupergroup(chat_id) {
        var chat_id = String(chat_id).replace(/(-100|-)/ig, "")
        return await this.client.invoke({
            '_': "getSupergroup",
            'supergroup_id': Number(chat_id)
        });
    }
    async getSupergroupMembers(chat_id, offset = 0) {
        if (new RegExp("^-.*", "i").exec(chat_id)) {
            chat_id = String(chat_id).replace(/(-100)/ig, "")
        } else {
            chat_id = chat_id
        }
        var hasil = await this.client.invoke({
            '_': "getSupergroupMembers",
            'supergroup_id': Number(chat_id),
            'offset': offset,
            'limit': 200
        })
        return hasil;
    }
    async getSupergroupFullInfo(chat_id) {
        var chat_id = chat_id
        if (RegExp("^-.*", "i").exec(chat_id)) {
            chat_id = String(chat_id).replace(/(-100)/ig, "")
        } else {
            chat_id = chat_id
        }
        return await this.client.invoke({
            '_': "getSupergroupFullInfo",
            'supergroup_id': chat_id
        });
    }
    async typeChat_Id(chat_id) {
        if (typeof chat_id == "string") {
            var searchPublicChat = await this.searchPublicChat(String(chat_id).replace(/(@)/ig, ""));
            if (searchPublicChat["_"]) {
                return searchPublicChat["id"];
            }
        } else {
            return chat_id;
        }
    }

    async typeMessage_id(message_id) {
        if (new RegExp("^https://|t.me", "i").exec(message_id)) {
            var getMessageLinkInfo = await this.getMessageLinkInfo(message_id);
            if (getMessageLinkInfo["_"]) {
                if (getMessageLinkInfo["message"]) {
                    return getMessageLinkInfo["message"]["id"];
                }
            }
        } else {
            return message_id;
        }
    }
    async reportChat(chat_id, type = "custom", text = "report", message_id) {
        var check = await this.typeChat_Id(chat_id)
        var getMessageLinkInfo = await this.typeMessage_id(message_id)
        var data = {
            '_': "reportChat",
            'chat_id': check,
            'message_ids': [getMessageLinkInfo]
        };
        if (new RegExp("^porn$", "i").exec(type)) {
            data["reason"] = {
                '_': "chatReportReasonCustom",
                "text": text
            }
        } else if (new RegExp("^custom$", "i").exec(type)) {
            data["reason"] = {
                '_': "chatReportReasonCustom",
                "text": text
            }
        }
        return await this.client.invoke(data);
    }
    async getMessageLink(chat_id, message_id, for_album = false, for_comment = false) {
        var data = {
            '_': "getMessageLink",
            'chat_id': chat_id,
            'message_id': message_id,
        };
        if (for_album) {
            data["for_album"] = for_album;
        }

        if (for_comment) {
            data["for_comment"] = for_comment;
        }
        return await this.client.invoke(data);
    }
    async getMessageLinkInfo(link) {
        return await this.client.invoke({
            '_': "getMessageLinkInfo",
            'url': link
        });
    }
    async sendChatScreenshotTakenNotification(chat_id) {
        return await this.client.invoke({
            '_': "sendChatScreenshotTakenNotification",
            'chat_id': chat_id
        });
    }

    async setAuthenticationPhoneNumber(phone_number) {
        return await this.client.invoke({
            '_': "setAuthenticationPhoneNumber",
            "phone_number": phone_number
        });
    }

    async checkAuthenticationCode(code) {
        return await this.client.invoke({
            '_': "checkAuthenticationCode",
            "code": code
        });
    }

    async checkAuthenticationPassword(password) {
        return await this.client.invoke({
            '_': "checkAuthenticationPassword",
            "password": password
        });
    }

}

module.exports = {
    telegram
}