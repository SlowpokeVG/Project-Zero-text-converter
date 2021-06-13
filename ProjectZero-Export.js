const fs = require("fs");
let arg = process.argv.slice(2);
let objPath = arg[0];
let symbols = require('./ProjectZero-Table');

function readMessage (start, file)
{
    let stringe = '';
    while ((file[start] != 0xFF)&&(start < file.length))
    {
        if (symbols.table.getValueByName(file[start].toString()) == undefined) 
            throw ("Undefined symbol " + file[start]) //check table if this happened;

        stringe += symbols.table.getValueByName(file[start].toString());
        start++;
    }    
    return stringe;
}

function readGroup (startGr, file)
{

    let potentialMessageOffsets = [];
    let messages = [];
    let s = startGr;
    potentialMessageOffsets.push(file.length);
    while (s < Math.min(...potentialMessageOffsets))
    {
        let offset = file.readUInt32LE(s);
        potentialMessageOffsets.push(offset);
        if ((file.readUInt32LE(offset) >= s)&&(file.readUInt32LE(offset) <= file.length)) 
            messages.push(readGroup(offset, file));
        else
            messages.push(readMessage(offset, file));
        s += 4;
    }
    return messages;
}

let inputOBJ = fs.readFileSync(objPath);

let contentStart = inputOBJ.readUInt32LE(0);
let groupsOffest = [];
let messageGroup = [];

for (let i = 0; i < contentStart; i+=4)
{
    groupsOffest.push(inputOBJ.readUInt32LE(i));
}

for (let i = 0; i < groupsOffest.length; i++)
{
    let groupEnd = inputOBJ.length;
    if (i < groupsOffest.length - 1) {groupEnd = groupsOffest[i+1];}
    messageGroup.push(readGroup(groupsOffest[i], inputOBJ));
} 

fs.writeFileSync(objPath + ".json", JSON.stringify(messageGroup,null,4));