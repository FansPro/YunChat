import { observable, action, set } from 'mobx';
import { AsyncStorage, Alert, NetInfo } from 'react-native';
import configs from '../../configs';
import constObj from '../constant';
import chatroomStore from '../stores/chatroom';
import msgAction from './msg';
import globalStatus from '../stores/status';
import util from '../../util';
import { showNotification } from '../../../nim/NIM_Android_Push';

const NIM_SDK = require('../../../nim/NIM_Web_Chatroom_rn_v6.1.0');
const SDK = require('../../../nim/NIM_Web_SDK_rn_v6.1.0');
const Realm = require('realm');

const iosPushConfig = {
    tokenName: 'push_online',
};
const androidPushConfig = {
    xmAppId: '2882303761517806219',
    xmAppKey: '5971780672219',
    xmCertificateName: 'RN_MI_PUSH',
    hwCertificateName: 'RN_HW_PUSH',
    mzAppId: '113798',
    mzAppKey: 'b74148973e6040c6abbda2af4c2f6779',
    mzCertificateName: 'RN_MZ_PUSH',
    fcmCertificateName: 'RN_FCM_PUSH',
};

SDK.usePlugin({
    db: Realm,
});

function saveMsgs() {
    // msgs.forEach((msg) => {
    //   msgAction.appendMsg(msg);
    // });
}

function onSysMsgs(sysmsgs) {
    if (!Array.isArray(sysmsgs)) {
        sysmsgs = [sysmsgs];
    }
    sysmsgs.forEach((sysmsg) => {
        switch (sysmsg.type) {
            // 在其他端添加或删除好友
            case 'addFriend':
                // set(nimStore.friendFlags, sysmsg.from, true);
                if (sysmsg.friend) {
                    nimStore.friendslist = constObj.nim.mergeFriends(nimStore.friendslist, [sysmsg.friend]);
                    nimStore.friendFlags.set(sysmsg.from, true);
                }
                nimStore.sysMsgs.push(sysmsg);
                break;
            case 'applyFriend':
                nimStore.sysMsgs = constObj.nim.mergeSysMsgs(nimStore.sysMsgs, [sysmsg]);
                nimStore.sysMsgs = nimStore.sysMsgs.sort((a, b) => a.time - b.time);
                break;
            case 'deleteFriend':
                // set(nimStore.friendFlags, sysmsg.from, false);
                nimStore.friendFlags.delete(sysmsg.from);
                nimStore.sysMsgs.push(sysmsg);
                break;
            // 对方消息撤回
            case 'deleteMsg':
                msgAction.onBackoutMsg(null, sysmsg.msg);
                break;
            case 'teamInvite': // 被邀请入群
            case 'applyTeam': // 申请入群
            case 'rejectTeamApply': // 申请入群被拒绝
            case 'rejectTeamInvite': // 拒绝入群邀请
                break;
            default:
                break;
        }
    });
    // nimStore.sysMsgs = nimStore.sysMsgs.concat(sysmsgs);
}

class Actions {
    @observable chatroomStore



    @action
    getChatRoomAddress = () => {
        console.log("~~~~~~");
        constObj.nim.getChatroomAddress({
            chatroomId: "3001",
            done(error, obj) {
                console.log("chatroom", error, obj);
            }
        })
    }

    @action
    getChatroom() {
        constObj.chatroom.getChatroom({
            done(err, obj) {
                console.log("errrrrr", err, obj)
                chatroomStore.currChatroom = obj.chatroom;
            }
        })
    }



    @action
    initNIM = (account, token, callback) => {
        const self = this;
        constObj.chatroom = NIM_SDK.getInstance({
            debug: false,
            appKey: configs.appkey,
            account,
            db: true,
            token,
            chatroomId: "3001",
            chatroomAddresses: ["wlnimsc1.netease.im:443"],
            iosPushConfig,
            androidPushConfig,
            onwillreconnect() {
            },
            onconnect(obj) {
                console.log("connect-----");
                console.log('进入聊天室', obj);
                // 连接成功后才可以发消息
                callback(null);

            },
            onerror(event, obj) {
                console.log('IM error:', event, obj);
                // self.destroyNIM();
                // callback(event);
            },


            onmsgs(msgs) {
                console.log('收到聊天室消息', msgs);
                var msg = msgs.filter(item => {
                    return item.type !== "notification";
                })
                chatroomStore.currChatroomMsgs = chatroomStore.currChatroomMsgs.concat(msg);

            },

        });
    }
    @action
    sendTextMsg(options) {
        const { text } = options
        constObj.chatroom.sendText({
            text: text,
            done(err, msg) {
                console.log("sendMsg", msg)
                chatroomStore.currChatroomMsgs = chatroomStore.currChatroomMsgs.concat([msg]);
            }
        })
    }

    @action
    getHistoryMsgs() {
        constObj.chatroom.getHistoryMsgs({
            timetag: new Date().getTime(),
            limit: 10,
            msgTypes: ["text"],
            done(err, obj) {
                console.log("history", obj.msgs);
                chatroomStore.currChatroomMsgs = chatroomStore.currChatroomMsgs.concat(obj.msgs);
            }
        })
    }

    @action
    login = (account, token, callback) => {
        this.initNIM(account, token, callback);
    }


}

export default new Actions();