import React, { Component } from 'react';
import {Text, View, TouchableOpacity, FlatList} from 'react-native';
import { inject, observer } from 'mobx-react/native';
// import { View } from 'react-navigation';
import MD5 from '../util/md5';



import {chatStyle, contactStyle, globalStyle, headerStyle} from '../themes';
import {Header, Icon} from "react-native-elements";
import GoBack from "./chat";
import {RVW} from "../common";
import {ChatBox} from "../components/chatBox";
import uuid from "../util/uuid";
import {ChatLeft, ChatRight} from "../components/chatMsg";
import util from "../util";
import NavBottom from "./session";
// import { RVW } from '../common';


const constObj = {
    chatListRef: null,
};


@inject('chatroomStore', 'chatroomAction', 'linkAction')
@observer
export default class Page extends Component {
    constructor(props) {
        super(props);

        this.state = {
            refreshing: false,
        }
    }
    componentDidMount(): void {

        this.props.chatroomAction.login("888", MD5("123456"), () => {
            this.props.chatroomAction.getHistoryMsgs();
            this.props.chatroomAction.getChatroom();
        })
    }
    sendMsg = () => {
        this.props.chatroomAction.sendMsg();
    }
    renderItem = ((item) => {
        const msg = item.item;
         if (msg.type === 'tip') {
            return <Text style={chatStyle.tip}>{msg.tip}</Text>;
        } else if (msg.flow === 'in') {
            return (<ChatLeft
                msg={msg}
                nimStore={this.props.nimStore}
                navigation={this.props.navigation}
            />);
        } else if (msg.flow === 'out') {
            return (<ChatRight
                msg={msg}
            />);
        } else if (msg.type === 'timeTag') {
            return <Text style={chatStyle.timetag}>----  {msg.text}  ----</Text>;
        }
        return null;
    })
    renderMore = () => {
        if (this.state.showMore) {
            return (
                <View style={contactStyle.menuBox}>
                    <TouchableOpacity onPress={() => {
                        this.props.navigation.navigate('chatHistroy', { sessionId: this.sessionId });
                        this.setState({ showMore: false });
                    }}
                    >
                        <Text style={contactStyle.menuLine}>云端历史记录</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        this.props.msgAction.deleteLocalMsgs({
                            scene: this.scene,
                            to: this.toAccount,
                            done: (error) => {
                                if (error) {
                                    this.toast.show(JSON.stringify(error));
                                }
                            },
                        });
                        this.setState({ showMore: false });
                    }}
                    >
                        <Text style={contactStyle.menuLine}>清空本地历史记录</Text>
                    </TouchableOpacity>
                    <NavBottom navigation={navigation} />
                </View>
            );
        }
        return null;
    }
    loadMore = () => {

    }
    scrollToEnd = (animated = false) => {
        if (this.notScroll) {
            return;
        }
        util.debounce(200, () => {
            if (constObj.chatListRef) {
                // console.log('do');
                constObj.chatListRef.scrollToEnd({ animated });
            }
        });
    }
    render() {
        const { navigation, chatroomStore } = this.props;
        return (
            <View style={globalStyle.container}>
                <Header
                    outerContainerStyles={headerStyle.wrapper}
                    centerComponent={{ text: chatroomStore.currChatroom ? chatroomStore.currChatroom.name : "" , style: headerStyle.center }}
                    leftComponent={<Icon
                        type="evilicon"
                        name="arrow"
                        size={9 * RVW}
                        color="#fff"
                        onPress={() => this.props.navigation.goBack()}
                    />}
                    rightComponent={<Icon
                        type="evilicon"
                        name="clock"
                        size={9 * RVW}
                        color="#fff"
                        onPress={() => { this.setState({ showMore: !this.state.showMore }); }}
                    />}
                />
                <FlatList
                    style={{ marginVertical: 20 }}
                    data={this.props.chatroomStore.currChatroomMsgs}
                    keyExtractor={item => (item.idClient || item.idClientFake || item.key || uuid())}
                    renderItem={this.renderItem}
                    ref={(ref) => { constObj.chatListRef = ref; }}
                    onContentSizeChange={() => this.scrollToEnd()}
                    onRefresh={this.loadMore}
                    refreshing={this.state.refreshing}
                />
                <ChatBox
                    action={this.props.chatroomAction}
                    options={{
                        scene: null,
                        toAccount: null,
                    }}
                />
            </View>
        );
    }
}