const fs = require("fs");
let arg = process.argv.slice(2);
let jsonPath = arg[0];
let symbols = require('./ProjectZero-Table');

function totalArrayLength(inputArray)
{
    let arrayLength = 0;
    inputArray.forEach(element => {
        if (Array.isArray(element)) 
            arrayLength += totalArrayLength(element); 
        else 
            arrayLength += element.length;
    });
    return arrayLength;
}
function writeGroup (messageArray, startByte)
{
    let headerBuffer = Buffer.alloc(messageArray.length*4);
    let messageBuffers = [];
    messageBuffers.push(headerBuffer);
    let cumulativeMessageSize = 0;
    for (let s = 0; s < messageArray.length; s++)
    {
        if (!Array.isArray(messageBuffers[s])) 
            cumulativeMessageSize += messageBuffers[s].length; 
        else 
            cumulativeMessageSize += totalArrayLength(messageBuffers[s]);
        if (Array.isArray(messageArray[s])) 
            messageBuffers.push(writeGroup(messageArray[s], startByte + cumulativeMessageSize)); 
        else 
            messageBuffers.push(writeMessage(messageArray[s]));
        messageBuffers[0].writeUInt32LE(startByte + cumulativeMessageSize, s*4);
    }

    let groupBuffer = Buffer.concat(messageBuffers);
    return groupBuffer;
}

function writeMessage(messageString)
{
    let charArray = [];
    for (let n=0; n<messageString.length; n++)
    {
        if (messageString[n] == '<') 
        {
            charArray.push(parseInt(messageString[n+1]+messageString[n+2], 16));
            n+=3;
        }
        else if(messageString[n] != '>') 
        charArray.push(symbols.table.getNameByValue(messageString[n]));
    }    
    charArray.push(255);
    let messageBuffer = Buffer.from(charArray);
    return messageBuffer;
}

let inputOBJ = fs.readFileSync(jsonPath);

let messageGroups = [];
let buffersGroups = [];

messageGroups = JSON.parse(inputOBJ);
let byteGroupStart = messageGroups.length * 4;
let headerOBJBuffer = Buffer.alloc(byteGroupStart,'0');
for (let i = 0; i < messageGroups.length; i++)
{
    headerOBJBuffer.writeUInt32LE(byteGroupStart,i*4);
    let currentGroupBuffer = writeGroup(messageGroups[i], byteGroupStart);
    buffersGroups.push(currentGroupBuffer);
    byteGroupStart += currentGroupBuffer.length;
} 

fs.writeFileSync(jsonPath + ".obj", headerOBJBuffer);
fs.writeFileSync(jsonPath + ".obj", Buffer.concat(buffersGroups), {flag:'a'});
