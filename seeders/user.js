import { faker, simpleFaker } from "@faker-js/faker";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

const createUser = async (numUsers) => {
  try {
    const userPromise = [];

    for (let i = 0; i < numUsers; i++) {
      const tempUser = User.create({
        name: faker.person.fullName(),
        username: faker.internet.username(),
        bio: faker.lorem.sentence(10),
        password: "password",
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
      });
      userPromise.push(tempUser);
    }
    await Promise.all(userPromise);
    console.log("Users Created", numUsers);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};


const createSingleChats = async (num) => {
  try {
    const users = await User.find().select("_id");
    const chatPromise = [];
    
    for (let i = 0; i < num; i++) {
      for (let j = i + 1; j < num; j++) {
        chatPromise.push(
          Chat.create({
            name: faker.lorem.words(1),
            members: [users[i], users[j]],
          })
        )
        
      }      
    }
    await Promise.all(chatPromise);
    console.log("Single Chat Created");
    process.exit(1);
    
    
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const createGroupChats = async (num) => {
  try {
    const users = await User.find().select("_id");
    const chatPromise = [];

    for (let i = 0; i < num; i++) {
      const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
      const members = [];

      while (members.length < numMembers) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const randomUser = users[randomIndex];
        if (!members.includes(randomUser)) {
          members.push(randomUser);
        }
      }

      chatPromise.push(
        Chat.create({
          groupChat: true,
          name: faker.lorem.words(1),
          members,
          creator: members[0],
        })
      );
    }

    await Promise.all(chatPromise);
    console.log("Group Chats Created");
    process.exit(0); // Use 0 for successful exit

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};


const createMessage = async (num) => {
  try {
    const users = await User.find().select("_id");
    const chats = await Chat.find().select("_id");
    const messagePromise = [];

    for( let i = 0; i < num; i++){
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomChat = chats[Math.floor(Math.random() * chats.length)];
      messagePromise.push(
        Message.create({
          chat: randomChat,
          sender: randomUser,
          content: faker.lorem.sentence(10),})
      );
    }
    await Promise.all(messagePromise);
    console.log("Message created");
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const createMessageInChat = async (chatId, num) => {
  try {
    const users = await User.find().select("_id");
    const messagePromise = [];

    for( let i = 0; i < num; i++){
      const randomUser = users[Math.floor(Math.random() * users.length)];
      messagePromise.push(
        Message.create({
          chat: chatId,
          sender: randomUser,
          content: faker.lorem.sentence(10),})
      );
    }
    await Promise.all(messagePromise);
    console.log("Messages created in chat");
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export { createUser, createSingleChats, createGroupChats, createMessage, createMessageInChat };