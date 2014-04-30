/**
 * Copyright 2011, Ben Price
 * Licensed under the MIT license
 * http://www.xyleth.co.uk/returns/license.txt
 *
 * @author Ben Price
 * @version 1.6b
 * @fileoverview manipulates the FnH returns HTML form and calculates tithes
 *     and other IC related information
 */ 

//Define some global variables (yes I know globals are an ugly hack, but they work)
var orgID = 1; //Keep track of how many Guilds or Churches are added
var itemID = 1; // Keep track of how many magic items are added
var branchID = 1; //Keep track of how many adventure lines added
 
// Next section holds all the functions that will be called later
/**
 * Decodes a PHP urlencoded string into normal text
 * Not my work, taken from http://phpjs.org/functions/urldecode
 * Version: 1103.1210
 * @function urldecode
 * @param {String} str The string to be decoded
 * @returns {String} the decoded string
 */
function urldecode(str) {
    return decodeURIComponent((str + '').replace(/\+/g, '%20'));
}

/**
 * When a fee input cell is manually altered sets the override checkbox to on
 * @param {Object} e the calling element
 * @param {Bool} state What state to set the checkbox to
 * @param {Bool} reCalc do a re-calculation or not.  Only true when called from
 *      the fees box onChange when a user manually adjusts their fees
 */
function setOverRide(e, state, reCalc){
    var seqID, overRideID;
    
    seqID = getSequenceNumber(e);
    overRideID = "overRide" + seqID;
    $("#" + overRideID).prop("checked", state);
    if (reCalc) {
        totFees();
    }
}

/**
 * Controls which return options are available
 * @param {Bool} narrative Enable narrative export
 * @param {Bool} csv Enable CSV export
 * @param {Bool} gdoc Enabme Goolge Docs export
 */
 function showExportOptions(narrative, csv, gdoc){
     if (narrative) {
         $("#narrative").show();
     } else {
         $("#narrative").hide();
     }
     
     if (csv) {
         $("#csv").show();
     } else {
         $("#csv").hide();
     }
     
     if (gdoc) {
         $("#gdoc").show();
     } else {
         $("#gdoc").hide();
     }
 } 


/**
 * Changes gender aware rank selects while preserving the value
 *     Calls checkRanks() and setSpecificRank()
 */
function changeGender(){

    var tableName, iRowCount, iCurrentRow, oTable, oRow, oOrgCell, oOrgSelect;
    var arrSavedOrgs, arrSavedRanks, oRankCell, oRankSelect, i;
	
    tableName = "FeeTable";
	
    oTable = $("#" + tableName)[0];
    // Make sure we can get a reference to the tables
    if (oTable === null) {	
        return false;
    }
    
    // Iterate through the FeeTable storing any currently selected ranks
    arrSavedRanks = new Array();
    arrSavedOrgs = new Array();
    
    iRowCount = $('#' + tableName + ' tr').length; // using jQuery for FireFox
    for(iCurrentRow = 1; iCurrentRow < iRowCount; iCurrentRow++) { // Adjust iCurrentRow to start at 1 to avoid header row
        // Get the column using jQuery for compatability with FireFox
        oRow = $('#' + tableName +' tr:eq(' + iCurrentRow + ')');
        oOrgCell = $(oRow).find("td").eq('0');
        oOrgSelect = $(oOrgCell).find("select");
        oRankCell = $(oRow).find("td").eq('1');
        oRankSelect = $(oRankCell).find("select");
        arrSavedOrgs[iCurrentRow] = oOrgSelect.val();
        arrSavedRanks[iCurrentRow] = oRankSelect.val();
        oOrgCell = null;
    }
    // Then call checkRanks()
    checkRanks();
    // Then restore the previous ranks using set specific rank
    // Index starts at 1 as nothing gets stored in array position 0
    for(i = 1; i < arrSavedOrgs.length; i++) {
        setSpecificRank(arrSavedOrgs[i], arrSavedRanks[i]);
    }
    return true;
}

/**
 * Sets the users rank in the Crowan Church to match their rank in the Crowan Roses
 * @param {Object} objRank The rank select object containing the Rose rank
 */
function roseRankMatch(objRank) {
    switch (objRank.value) {
        case "Novice (D1)" :
            setSpecificRank("Church - Crowa", "D1");
            break;
            
        case "Novice (D2)" :
            setSpecificRank("Church - Crowa", "D2");
            break;
            
        case "Sister (D3 1st Month)" :
            setSpecificRank("Church - Crowa", "D3 (1st Month)");
            break;
            
        case "Sister (D3 2nd Month)" :
            setSpecificRank("Church - Crowa", "D3 (2nd Month)");
            break;
       
        case "Sister (D4 1st Month)" :
            setSpecificRank("Church - Crowa", "D4 (1st Month)");
            break;
            
        case "Sister (D4 2nd Month)" :
            setSpecificRank("Church - Crowa", "D4 (2nd Month)");
            break;
            
        case "Sister (D5 1st Month)" :
            setSpecificRank("Church - Crowa", "D5 (1st Month)");
            break;
            
        case "Sister (D5 2nd Month)" :
            setSpecificRank("Church - Crowa", "D5 (2nd Month)");
            break;
            
        case "Mother (D6 1st Month)" :
            setSpecificRank("Church - Crowa", "D6 (1st Month)");
            break;
            
        case "Mother (D6 2nd Month)" :
            setSpecificRank("Church - Crowa", "D6 (2nd Month)");
            break;
            
        case "Mother (D6 3rd Month)" :
            setSpecificRank("Church - Crowa", "D6 (3rd Month)");
            break;
        
        case "Mother (D7)" :
            setSpecificRank("Church - Crowa", "D7");
            break;
    }
}

/**
 * Sets a specific Rank entry in the feeTable to a specific value
 * Used by the Knight code to automatically set Kindred status on their
 *     churches mainly
 * @param {String} orgName The name of the orginsation rank to set
 * @param {String} rankName The value of the rank to set
 */
function setSpecificRank(orgName, rankName) {
    var oTable, oRow, iCurrentRow, iRowCount, oCell, oSelect, seqId;
    oTable = $("#FeeTable");
    
    // Iterate through the table
    iRowCount = $('#FeeTable tr').length; // using jQuery for FireFox
    for(iCurrentRow = 1; iCurrentRow < iRowCount; iCurrentRow++) { // Adjust iCurrentRow to start at 1 to avoid header row
        // Get the column using jQuery for compatability with FireFox
        oRow = $('#FeeTable tr:eq(' + iCurrentRow + ')');
        oCell = $(oRow).find("td").eq(0);
        oSelect = $(oCell).find("select");
        if ( oSelect[0].value == orgName ) {
            seqId = getSequenceNumber(oSelect[0]);
            $('#orgRankID' + seqId).val(rankName);
            break;
        }
        oCell = null;
    }
}

/**
 * Checks to see if an orginsation already exists in the FeeTable.
 * Used by the Knight code to see if we need to add the relevant Churches
 * Also used to check if a Physician is a member of the Vleyborian Church
 * @param {String} tableName The name of the table to check (usually FeeTable)
 * @param {Number} column The table column number of to search
 * @param {String} targetValue The orginastion name to search for
 * @returns {Bool} True if found, false if not
 */
function checkSelectValue(tableName, column, targetValue) {
    var oTable, oRow, iCurrentRow, iRowCount, oCell, oSelect, bResult;
    bResult = false;
    oTable = $('#' + tableName);
    // Make sure we can get a reference to the tables
    if (oTable === null) {	
        return bResult;
    }

    iRowCount = $('#' + tableName + ' tr').length; // using jQuery for FireFox
    for(iCurrentRow = 1; iCurrentRow < iRowCount; iCurrentRow++) { // Adjust iCurrentRow to start at 1 to avoid header row				
        // Get the column using jQuery for compatability with FireFox
        oRow = $('#' + tableName +' tr:eq(' + iCurrentRow + ')');
        oCell = $(oRow).find("td").eq(column);
        oSelect = $(oCell).find("select");
        if ( oSelect[0].value == targetValue ){
            bResult = true; // If we find the value set the flag to true
            break;
        }
        oCell = null;
    }
    return bResult;
}

/**
 * Returns the rank select content for a specific orginsation
 * @param {String} tableName The name of the table to check (usually FeeTable)
 * @param {Number} column The table column number of to search
 * @param {String} targetValue The orginastion name to search for
 * @returns {Bool/String} FALSE if not found, string containing the rank if found
 */
function getSpecificRank(tableName, column, targetValue) {
    var oTable, oRow, iCurrentRow, iRowCount, oCell, oSelect, bResult;
    var rankCell, rankSelect;
    bResult = false;
    oTable = $('#' + tableName);
    // Make sure we can get a reference to the tables
    if (oTable === null) {	
        return bResult;
    }

    iRowCount = $('#' + tableName + ' tr').length; // using jQuery for FireFox
    for(iCurrentRow = 1; iCurrentRow < iRowCount; iCurrentRow++) { // Adjust iCurrentRow to start at 1 to avoid header row				
        // Get the column using jQuery for compatability with FireFox
        oRow = $('#' + tableName +' tr:eq(' + iCurrentRow + ')');
        oCell = $(oRow).find("td").eq(column);
        oSelect = $(oCell).find("select");
        if ( oSelect[0].value == targetValue ){
            //Get the Select for row + 1 (the rank row)
            rankCell = $(oRow).find("td").eq(column+1);
            rankSelect = $(rankCell).find("select");
            bResult = rankSelect[0].value;
            break;
        }
        oCell = null;
    }
    return bResult;
}
/**
 * Clears all form related cookies
 */
function clearCookies() {
    $.cookie("basicInfo", null);
    $.cookie("orgNames", null);
    $.cookie("orgRanks", null);
    $.cookie("itemNumber", null);
    $.cookie("itemName", null);
}

/**
 * Checks for the existence of a named cookie
 * @param {String} name The name of the cookie to search for
 * @returns {Bool} true if found, false if not
 */

function checkCookie(name)
{
    name = name + "=";
    var cookies = document.cookie.split(';');
 
    for (var i = 0; i < cookies.length; i++) {
        var c = cookies[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(name) === 0) {
            return true;
        }
    }
    return false;
}

/**
 * Iterates through the org selects in the FeeTable and calls the setRanks
 *     function on each one in turn.  Used to ensure the form keeps up with 
 *     user input.
 */
function checkRanks() {
    var tableName, iRowCount, iCurrentRow, oTable, oRow, oCell, oSelect;
	
    tableName = "FeeTable";
	
    oTable = $("#" + tableName)[0];
    // Make sure we can get a reference to the tables
    if (oTable === null) {	
        return;
    }
    
    iRowCount = $('#' + tableName + ' tr').length; // using jQuery for FireFox
    for(iCurrentRow = 1; iCurrentRow < iRowCount; iCurrentRow++) { // Adjust iCurrentRow to start at 1 to avoid header row
        // Get the column using jQuery for compatability with FireFox
        oRow = $('#' + tableName +' tr:eq(' + iCurrentRow + ')');
        oCell = $(oRow).find("td").eq('0');
        oSelect = $(oCell).find("select");
        setRanks(oSelect['0']);
        oCell = null;
    }
}

/**
 * Maps a selected rank to a numeral value for consumption by the getGuildFees
 *     function.
 * @param {Object} objRank a reference to the rank select object in question
 * @returns {Number} A value representing the relevant rank
 */
function getRank(objRank) {
    var rank;
	
    if (objRank.value.indexOf("Apprentice") !==-1) {
        rank = 0;
    } else if (objRank.value.indexOf("Journeyman") !==-1) {
        rank = 1;
    }else if (objRank.value.indexOf("Junior Guildsman") !==-1){ //JG and G are reversed so that JG is caught first.  This is because JG contains G which confuses the checking algorithm otherwise.
        rank = 2;
    }else if (objRank.value.indexOf("High Guildsman") !==-1) { //HG and G are reversed so that HG is caught first.  This is because HG contains G which confuses the checking algorithm otherwise.
        rank = 4;
    } else if (objRank.value.indexOf("Guildsman") !==-1) {
        rank = 3;
    } else if (objRank.value.indexOf("Guild Senior") !==-1) {
        rank = 5;
    } else if (objRank.value.indexOf("Master") !==-1) {
        rank = 6;
    } else if (objRank.value.indexOf("Guild Protector") !==-1 || objRank.value.indexOf("Keeper") !== -1 ) { // More annoying mage stuff
        rank = 7;
    } else if (objRank.value.indexOf("Guildmaster") !==-1  || objRank.value.indexOf("Schoolmaster") !== -1 ) { //Catch those pesky mages
        rank = 8;
    }
	
    return  rank;
}
 
/**
  * Returns a whole number of Crowns based on a value given in pennies
  * @param {Number} crownIn The number of Pennies to convert to Crowns
  * @returns {Number} The number of whole Crowns
  */
function to_crown(crownIn) {
    var crown, notNumber;
    crown = parseInt(crownIn/12, 10); // Calculates the Total Expenditure Crown value i.e. integer
    notNumber = String(crown);
    if (notNumber === "NaN") {  // If there is less than 1 crown return a 0 value instead of not a number NaN
        crown = 0;
    }
    return crown; // returns crown value ends function
}

/**
 * Calculates the number of remaining Pennies once whole Crowns are accounted
 *    for from a value given in Pennies.
 * @param {Number} penny The number of pennies
 */
function dec_to_penny(penny) {
    var negFlag;
    if (penny < 0 ) { //Check to see if it is a negative penny value
        negFlag = 1; //Set the negative flag for later
        penny = penny * -1; // convert to a positive number as the code below has issues with negatives
    }
    penny = (penny/12);  // Changes a total pennies value to decimal
    penny = penny - Math.floor(penny); // Extracts just the decimal places
    penny = Math.round(penny*100)/100; // Rounds to 2 decimal places - hundredths:
    penny = String(penny); // Converts to a string for use in substring statement
    if (penny.substr(0,1) === "0") { // If value has 0. in front of it i.e less than 1 crown
        penny = penny.substr(2,2); // Extract 3rd & 4th characters loses the 0.
    } else {
        penny = penny.substr(1,2); // Else extract 2nd and 3rd loses the .
    } 
    switch (penny) {  // Uses the remaining rounded 2 decimal places to calculate a penny value i.e 1/12
        case "0" :
            penny = 0;
            break;
        case "08" :
            penny = 1;
            break;
        case "17" :
            penny = 2;
            break;
        case "25" :
            penny = 3;
            break;
        case "33" :
            penny = 4;
            break;
        case "42" :
            penny = 5;
            break;
        case "5" :
            penny = 6;
            break;
        case "58" :
            penny = 7;
            break;
        case "67" :
            penny = 8;
            break;
        case "75" :
            penny = 9;
            break;
        case "83" :
            penny = 10;
            break;
        case "92" :
            penny = 11;
            break;
        default :
            penny = 0;	// If calculation gets nothing or a 0 value return 0
    }
	
    if (negFlag === 1) {
        penny = penny * -1;
    } //If this was a negative number coming in make sure it is a negative number going out
    return penny; // returns penny value
}

/**
 * Adds an sepcified value and text pair to a specified Select
 * @param {String} rankID The ID of the select to modify
 * @param {String} optText Text to insert into the text property
 * @param {String} [optValue] Optional text to insert into the value property
 */
function addOption(rankID, optText, optValue) {
    // If optValue isn't set then insert optText into both fields
    if (optValue === undefined) {
        optValue = optText;
    }
    $("#" + rankID).addOption(optValue, optText);
}

/**
 * Accepts an array of Rank values and uses addOption to update the specified
 *     rank select with those options.
 * @param {String} rankID The ID of the rank select to update
 * @param {array} rankArray Array containing the Full rank values
 * @param {array} [baseRankArray] Optional array containing the short rank values
 */
function addRanks(rankID, rankArray, baseRankArray) {
    var i;
    // If baseRankArray isn't passed send only the rankArray
    if (baseRankArray === undefined) {
        for (i = 0; i < rankArray.length; i++) { 
            addOption(rankID, rankArray[i]) ;
        }
    } else {
        for (i = 0; i < rankArray.length; i++) { 
            addOption(rankID, rankArray[i], baseRankArray[i]) ;
        }
    }
	
}

/**
 * Adds a new row to FeeTable
 * @param {String} tblName The table to add a row to (usuall FeeTable)
 * @param {String} [orgName] Optional the name of the orginsation to set the 
 *    new row to
 */
function addFeeRow(tblName, orgName) {
    //define all our variables
    var orgSelectID, orgRankID, orgFeesCrownsID, orgFeesPenniesID;
    var insertText, ranks, overRideID, rowID, indexBase;
    var index1, index2, index3, index4, index5, index6;
   
    orgSelectID = "orgID" + orgID;
    orgRankID = "orgRankID" + orgID;
    overRideID = "overRide" + orgID;
    rowID = "feeRow" + orgID;
    orgFeesCrownsID = "orgFeesCrownsID" + orgID;
    orgFeesPenniesID = "orgFeesPenniesID" + orgID;
    indexBase = 224 + (7 * parseInt(orgID, 10));
    index1 = indexBase + 1;
    index2 = indexBase + 2;
    index3 = indexBase + 3;
    index4 = indexBase + 4;
    index5 = indexBase + 5;
    index6 = indexBase + 6;

    insertText = "<tr id='" + rowID + "'>\
            <td class='tableEntryText'>\
                <select size='1' name='Org[]' id='" + orgSelectID + "'\
                    onchange='javascript:setRanks(this)' tabindex='" + indexBase + "'>\
                    <option value='none' selected>Select an option</option>\
                    <option value='Guild - Alchemist'>Alchemist</option>\
                    <option value='Guild - Blacksmiths'>Blacksmiths</option>\
                    <option value='Guild - Mercenaries'>Mercenaries</option>\
                    <option value='Guild - Physician'>Physician</option>\
                    <option value='Guild - Scouts'>Scouts</option>\
                    <option value='Guild - Law - Guard'>Law - Guard</option>\
                    <option value='Guild - Law - Forester'>Law - Forester</option>\
                    <option value='Guild - Mage - Demonologist'>Mage - Demonologist</option>\
                    <option value='Guild - Mage - Enchanter'>Mage - Enchanter</option>\
                    <option value='Guild - Mage - General'>Mage - General</option>\
                    <option value='Guild - Mage - Necromancer'>Mage - Necromancer</option>\
                    <option value='Guild - Thief'>Thief</option>\
                    <option value='Church - Crowa'>Church - Crowa</option>\
                    <option value='Church - Kharach'>Church - Kharach</option>\
                    <option value='Church - Longstor'>Church - Longstor</option>\
                    <option value='Church - Rolbor'>Church - Rolbor</option>\
                    <option value='Church - Sidhe'>Church - Sidhe</option>\
                    <option value='Church - Tralda'>Church - Tralda</option>\
                    <option value='Church - Vleybor'>Church - Vleybor</option>\
                    <option value='Crowan Rose'>Crowan Rose</option>\
                    <option value='Knight - Black'>Knight - Black</option>\
                    <option value='Knight - Grey'>Knight - Grey</option>\
                    <option value='Knight - Griffin'>Knight - Griffin</option>\
                    <option value='Knight - Templar'>Knight - Templar</option>\
                    <option value='Populace'>Populace e.g Peasant/churl</option>\
                    <option value='Council'>Under council appointments</option>\
                    <option value='OtherSpecial'>Other or Special</option>\
                </select>\
            </td>\
            <td class='tableEntryText'>\
                <select name='Rank[]' size='1' id='" + orgRankID + "' tabindex='" + index1 + "'\
                    onChange='javascript:totFees(this)' style='width: 240px;'>\
            </td>\
            <td class='tableEntryText'>\
                <input maxLength='6' size='6' value='0' name='Fees_Crowns[]' tabindex='" + index2 + "'\
                    id='" + orgFeesCrownsID + "'\
                    onchange='setOverRide(this, true, true)'>\
            </td>\
            <td class='tableEntryText'>\
                <input maxLength='2' size='6' value='0' name='Fees_Pennies[]' tabindex='" + index3 + "'\
                     id='" + orgFeesPenniesID + "'\
                     onchange='setOverRide(this, true, true)'>\
            </td>\
            <td class='tableEntryText'>\
                <input type=radio name='AdvanceID' value='" + orgID +"' tabindex='" + index4 + "'>\
            </td>\
            <td>\
                <input type=checkbox id='" + overRideID + "' tabindex='" + index5 + "'>\
            </td>\
            <td>\
                <button type='button' class='deleteRowButton'\
                    id='" + rowID + "' onclick='removeRow(this)' tabindex='" + index6 + "'>\
                </button>\
            </td>\
        </tr>";
    $('#' + tblName +' > tbody:first').append(insertText);
    $(".deleteRowButton").button({
        icons: {
            primary: "ui-icon-trash"
        },
        text: false
    });
    orgID++;
    // If orgName is defined set the new row to that and update ranks
    if ( orgName !== undefined ) {
        $('#' + orgSelectID).val(orgName);
        checkRanks();
    } else {
        // Otherwise just put the default entry into the rank select
        // Catch for IE weirdness on the rank table
        ranks = ["Select a Rank"];
        addRanks(orgRankID, ranks);
    }
}

/**
 * Adds a row to the table of branches advetured at this month
 * @param {String} tblName the name of the table to extend
 */
function addBranchRow(tblName) {
    // define our vars
    var insertText, rowID;
    var indexBase, index1, index2;
    //add a row to the rows collection and get a reference to the newly added row
    rowID = "branchRow" + branchID;
    indexBase = 298 + (3 * parseInt(branchID,10));
    index1 = indexBase + 1;
    index2 = indexBase + 2;

    insertText = "<tr id='" + rowID + "'>\
        <td class='tableEntryText'>\
            <select size='1' name='adventureBranch[]' tabindex='" + indexBase + "'>\
                <option value='DNA'>DNA</option>\
                <option value='Bath'>Bath</option>\
                <option value='BlackCountry'>Black Country</option>\
                <option value='Bolton'>Bolton</option>\
                <option value='Bristol'>Bristol</option>\
                <option value='Cardiff'>Cardiff</option>\
                <option value='Derby'>Derby</option>\
                <option value='Edinburgh'>Edinburgh</option>\
                <option value='Guildford'>Guildford</option>\
                <option value='Hull'>Hull</option>\
                <option value='Leeds'>Leeds</option>\
                <option value='Leicester'>Leicester</option>\
                <option value='Maidenhead'>Maidenhead</option>\
                <option value='Newcastle'>Newcastle</option>\
                <option value='Nottingham'>Nottingham</option>\
                <option value='Norwich'>Norwich</option>\
                <option value='Oxford'>Oxford</option>\
                <option value='Portsmouth'>Portsmouth</option>\
                <option value='Sheffield'>Sheffield</option>\
                <option value='StHelens'>St Helens</option>\
                <option value='TeesValley'>Tees Valley</option>\
                <option value='Summerfest'>Summerfest</option>\
                <option value='Springfest'>Springfest</option>\
                <option value='OtherFest'>Other - Fest</option>\
                <option value='OtherSpecial'>Other - Special</option>\
            </select>\
        </td>\
        <td class='tableEntryText'>\
            <input size='6' value='0' name='adventureNumber[]' tabindex='" + index1 + "'>\
        </td>\\n\
        <td>\
            <button type='button' class='deleteRowButton' id='" + rowID + "' onclick='removeRow(this)' tabindex='" + index2 + "'>\
            </button>\
        </td>\
        </tr>";
    
    $('#' + tblName +' > tbody:first').append(insertText); 
    $(".deleteRowButton").button({
        icons: {
            primary: "ui-icon-trash"
        },
        text: false
    });    
    branchID++;
}

/**
 * Add a row to the Magic item table
 * @param {String} tblName the name of the table to extend
 */
function addMagicItemRow(tblName) {
    // define our vars
    var itemSelectID, itemNameID, insertText, rowID;
    var indexBase, index1, index2;

    itemSelectID = "itemID" + itemID;
    itemNameID = "itemName" + itemID;
    rowID = "itemRow" + itemID;
    indexBase = 398 + (3 * parseInt(itemID, 10));
    index1 = indexBase + 1;
    index2 = indexBase + 2;

    insertText = "<tr id='" + rowID + "'>\
                    <td class='tableEntryText'>\
                        <input size='20' name='magicItemNumber[]' id='" + itemSelectID + "' tabindex='" + indexBase + "'>\
                    </td>\
                    <td class='tableEntryText'>\
                        <input size='50' name='magicItemName[]' id='" + itemNameID + "' tabindex='" + index1 + "'>\
                    </td>\
                    <td>\
                        <button type='button' class='deleteRowButton' id='" + rowID + "' onclick='removeRow(this)' tabindex='" + index2 + "'>\
                        </button>\
                    </td>\
                </tr>";
    
    $('#' + tblName +' > tbody:first').append(insertText);
    $(".deleteRowButton").button({
        icons: {
            primary: "ui-icon-trash"
        },
        text: false
    });
    itemID++;
}

/**
 * Deletes the specified row from its parent table
 * @param {Object} e The calling input button
 */
function removeRow(e) {
    // Finally remove the row
    $("#" + e.id).remove();
    totFees(); // Force a recalculation
}

/**
 * Returns the value of a specified cell
 * Used for extracting numbers from various money related text boxes throughout
 *    the form.
 * @param {String} tableName The table that holds the input box
 * @param {Number} RowNumber The row the input box is in
 * @param {Number} ColumnNumber The column the input box is in
 * @returns {Number} The numerial value of the specified cell
 */
function getInputCellValue(tableName, RowNumber, ColumnNumber) {
    var sValue, dValue, dReturn, oCell, oRow;
    dValue=0;
    dReturn=0;
    // Get the column using jQuery for compatability with FireFox
    oRow = $('#' + tableName +' tr:eq(' + RowNumber + ')');
    oCell = $(oRow).find("td").eq(ColumnNumber);
    dValue = parseInt(oCell[0].getElementsByTagName('INPUT')[0].value, 10);
    oCell = null;
    return dValue;
}

/**
 * Parses the given column of a table and sums all numeric values in that column
 * @param {String} tableName The name of the table to parse
 * @param {Number} ColumnNumber The column to sum over
 * @returns {Number} The column total
 */
function totalTableColumn(tableName, ColumnNumber) {
    var dTotal, iRowCount, iCurrentRow, dValue, oTable, rows;
    oTable = $("#" + tableName)[0];
    // Make sure we can get a reference to the tables
    if (oTable === null) {
        // We cant get the table refernce so return 0
        return 0;
    }

    dTotal = 0;
    iRowCount = $('#' + tableName + ' tr').length; // using jQuery for FireFox
    for(iCurrentRow = 1; iCurrentRow < iRowCount; iCurrentRow++){ // Adjust iCurrentRow to start at 1 to avoid header row
        dValue = getInputCellValue(tableName, iCurrentRow, ColumnNumber);
        dTotal += dValue;
    }
    return dTotal;
}

/**
 * Extracts the sequence number from an objects ID
 * Used to correlate various selects to one another via their ID property
 * @param {Object} e The calling object
 * @returns {Number} The sequence ID
 */
function getSequenceNumber(e) {
    var idLocation, seqID;
    //extract the id sequence number, the last number of the calling elements (e) id
    idLocation = e.id.length - 1;
    seqID = e.id.charAt(idLocation);
    return seqID;
}

/**
 * Removes all existing Select options from the referenced select
 * @param {String} rankID The ID of the select to trim
 */
function clearOptions(rankID) {
    $("#" + rankID).removeOption(/./);
}

/**
 * Looks up the guild fees from the relevant Array.
 * Accepts the numeral rank descriptor from getRank
 * @param {String} guild A short ID of the guild to check for
 * @param {Number} rank The numeral ID of the rank to check for
 * @returns {Array} Relevant guild fees in crowns and pennies
 */
function getGuildFees(guild, rank) {
    var mercFeesCrowns, mercFeesPennies, retFees, lawPayCrowns;
    var lawPayPennies, bsFeesCrowns, bsFeesPennies, psFeesCrowns;
    var psFeesPennies, alFeesCrowns, alFeesPennies, mgFeesCrowns;
    var mgFeesPennies, tlFeesCrowns, tlFeesPennies, tlTitheCrowns;
    var tlTithePennies, inCrown, inPennies, totalIn, totalInI, penny, t12;
    // First we need to set up all our Guild fee arrays.
    // The ranks and their array keys are 
    //     [0] => Apprentice, [1] => Journeyman, [2] => Junior Guildsman,
    //     [3] => Guildsman, [4] => High Guildsman, [5] = Guild Senior,
    //     [6] => Master, [7] => Guild Protector, [8] => Guild master
    // not all guilds will have all ranks.  
    // Where the rank doesn't exist 0 is entered.
    //                  0    1    2    3    4    5    6    7    8	
    mercFeesCrowns =  ["0", "0", "0", "2", "3", "4", "5", "0", "0"];
    mercFeesPennies = ["6", "0", "0", "0", "0", "0", "0", "0", "0"];
    lawPayCrowns =    ["0", "0", "0", "2", "0", "0", "5", "0", "10"];
    lawPayPennies =   ["0", "0", "0", "0", "0", "0", "0", "0", "0"];
    bsFeesCrowns =    ["3", "4", "0", "5", "6", "8", "10", "0", "0"];
    bsFeesPennies =   ["6", "0", "0", "0", "0", "0", "0", "0", "0"];
    psFeesCrowns =    ["1", "1", "0", "2", "3", "4", "5", "0", "0"];
    psFeesPennies =   ["0", "6", "0", "0", "0", "0", "0", "0", "0"];
    alFeesCrowns =    ["4", "6", "0", "8", "10", "12", "15", "0", "0"];
    alFeesPennies =   ["0", "0", "0", "0", "0", "0", "0", "0", "0"];
    mgFeesCrowns =    ["2", "4", "6", "8", "10", "12", "15", "0", "0"];
    mgFeesPennies =   ["0", "0", "0", "0", "0", "0", "0", "0", "0"];
    tlFeesCrowns =    ["0", "1", "1", "2", "0", "2", "0", "0", "0"];
    tlFeesPennies =   ["9", "0", "6", "0", "0", "0", "0", "0", "0"];
	
    retFees = ["0", "0"];

    switch (guild) {
        case "MS" : // Mercenaries
            retFees[0] = mercFeesCrowns[rank];
            retFees[1] = mercFeesPennies[rank];
            break;
        case "Law" : // Guards and Foresters
            retFees[0] = lawPayCrowns[rank];
            retFees[1] = lawPayPennies[rank];
            break;
        case "BS" : // Blacksmiths
            retFees[0] = bsFeesCrowns[rank];
            retFees[1] = bsFeesPennies[rank];
            break;
        case "PS" : // Physicians
            retFees[0] = psFeesCrowns[rank];
            retFees[1] = psFeesPennies[rank];
            break;
        case "AL" : // Alchemists
            retFees[0] = alFeesCrowns[rank];
            retFees[1] = alFeesPennies[rank];
            break;
        case "MG" : // Mages
            retFees[0] = mgFeesCrowns[rank];
            retFees[1] = mgFeesPennies[rank];
            break;
        case "TL" : // Thieves
            // Thieves tithe as a kindred to the Guild except for the Guild Protector and Guildmaster ranks
            if (rank === 7 || rank === 8) { 
                retFees[0] = tlFeesCrowns[rank];
                retFees[1] = tlFeesPennies[rank];
            } else {
                inCrown = parseInt($("#incomeCrowns").val(), 10); // Income fields
                inPennies = parseInt($("#incomePennies").val(), 10);
                totalIn = (inCrown*12) + inPennies;
                t12 = Math.round(totalIn*0.08333);
                t12 = t12 + parseInt((tlFeesCrowns[rank] * 12), 10) + parseInt(tlFeesPennies[rank], 10); // Add the Thiefs guild fees into the total before converting back into crowns / pennies
                totalInI = to_crown(t12); // Call the convert a penny value to crowns function
                penny = dec_to_penny(t12);  // Call function to calculate penny value
                retFees[0] = totalInI;
                retFees[1] = penny;
            }
            break;
    }
	
    return retFees;
}

/**
 * Restores remembered user information stored in cookies to the form
 */
function rememberMe() {
    var basicInfo, orgRanks, orgNames, itemNumber, itemName, iCurrentOrg;
    var iCurrentOrgId, iCurrentItem, itemSelectID, itemNameID;
    // Cookies we have to work with: basicInfo, orgNames, orgRanks,
    //     itemNumber and itemName
    // basicInfo contains Player Name, Player Branch, Membership number,
    //     Charater name, Race, Final balance (pennies) and gender 
    //     all in a JSON array
    basicInfo = JSON.parse(urldecode($.cookie("basicInfo")));
    $("#Player_name").val(basicInfo[0]);
    $("#branch").val(basicInfo[1]);
    $("#Membership_number").val(basicInfo[2]);
    $("#Character_name").val(basicInfo[3]);
    $("#Character_Race").val(basicInfo[4]);
    $("#startCrowns").val(to_crown(basicInfo[5]));
    $("#startPennies").val(dec_to_penny(basicInfo[5]));
    $("#gender").val(basicInfo[6]);
    //orgNames is a simple JSON array of the orgs we are a member of
    orgNames = JSON.parse(urldecode($.cookie("orgNames")));
    for(iCurrentOrg = 0; iCurrentOrg < orgNames.length; iCurrentOrg++) {
        // set orgs
        addFeeRow("FeeTable");
        iCurrentOrgId = "orgID" + (iCurrentOrg + 1);
        $("#" + iCurrentOrgId).val(orgNames[iCurrentOrg]);
    }
    checkRanks(); // populate our Rank arrays so we can set them below
    //orgRanks is a simple JSON array of the corresponding ranks
    //    in the orgs we are a member of
    orgRanks = JSON.parse(urldecode($.cookie("orgRanks")));
    for(iCurrentOrg = 0; iCurrentOrg < orgRanks.length; iCurrentOrg++) { 
        // set orgs
        iCurrentOrgId = "orgRankID" + (iCurrentOrg + 1);
        $("#" + iCurrentOrgId).val(orgRanks[iCurrentOrg]);
    }
    // Finally we do magic items
    if (checkCookie("itemNumber")) {
        // Item Number is a JSON array of item numbers
        itemNumber = JSON.parse(urldecode($.cookie("itemNumber")));
        itemName = JSON.parse(urldecode($.cookie("itemName")));
        for(iCurrentItem = 0; iCurrentItem < itemNumber.length; iCurrentItem++) {
            // set Items
            itemSelectID = "itemID" + (iCurrentItem + 1 );
            itemNameID = "itemName" + (iCurrentItem + 1 );
            addMagicItemRow('magicItemTable');
            $("#" + itemSelectID).val(itemNumber[iCurrentItem]);
            $("#" + itemNameID).val(itemName[iCurrentItem]);
        }
    }
}

// Pre-defining complete
// Do some start up type stuff
/**
 * Performs some basic form initilisaiton once it is ready
 * @function
 */
$(document).ready(function () {
    var rankID, ranks, baseRanks;
    
    // Set up our page if cookies Exist
    if ($.cookie("basicInfo")) {
        rememberMe();
    } else {
        addFeeRow("FeeTable");
        // Fix IE weirdness with addRanks only working the second time, we force it run once in code
        rankID = "orgRankID1";
        ranks = ["Select a Rank"];
        addRanks(rankID, ranks);
    }
    addBranchRow('AdventureTable');
    set_branch();  // Call set_Branch to show / hide appropiate export options
    $("#accordion").accordion({
        autoHeight: false        
    });
    $("#moneyTabs").tabs();
    $("input:submit").button();
    $("input:button").button();
    $("input:reset").button();
    $("#remember").button();
    $("#exportOptions").buttonset();
    $(".deleteRowButton").click(removeRow); // Add an onclick handler to our delete row buttons
    //setTabOrder();
    about("aboutYou"); // Show the About You instructions
});
 
// Now onto the functions that react to user events and consume the functions above
/**
 * Change the branch prefix in the membership number field based upon the 
 *     selected value of the branch select
 */
function set_branch() {
    var branch, prefix;
    // Set the branch prefix
    // Get which branch is selected
    branch = $("#branch").val();
    prefix = "";

    // Work out the branch prefix
    switch (branch) {
        case "Bath" :
            prefix = "BA";
            showExportOptions(true,false,false);
            break;
        case "BlackCountry" :
            prefix = "BC";
            showExportOptions(true,false,false);
            break;
        case "Bolton" :
            prefix = "BO";
            showExportOptions(true,false,false);
            break;
        case "Bristol" :
            prefix = "BR";
            showExportOptions(true,false,false);
            break;
        case "Cardiff" :
            prefix = "CA";
            showExportOptions(true,false,false);
            break;
        case "Derby" :
            prefix = "DE";
            showExportOptions(true,false,false);
            break;
        case "Edinburgh" :
            prefix = "ED";
            showExportOptions(true,false,false);
            break;
        case "Guildford" :
            prefix = "GU";
            showExportOptions(true,true,false);
            break;
        case "Hull" :
            prefix = "HU";
            showExportOptions(true,false,false);
            break;
        case "Independent" :
            prefix = "IN";
            showExportOptions(true,false,false);
            break;
        case "Leeds" :
            prefix = "LD";
            showExportOptions(true,false,false);
            break;
        case "Leicester" :
            prefix = "LE";
            showExportOptions(true,false,false);
            break;	
        case "Maidenhead" :
            prefix = "MA";
            showExportOptions(true,false,false);
            break;
        case "Newcastle":
            prefix = "NE";
            showExportOptions(true,false,false);
            break;
        case "Nottingham" :
            prefix = "NO";
            showExportOptions(true,false,false);
            break;
        case "Norwich" :
            prefix = "NW";
            showExportOptions(true,false,false);
            break;
        case "Oxford" :
            prefix = "OX";
            showExportOptions(true,false,false);
            break;
        case "Portsmouth" :
            prefix = "PO";
            showExportOptions(true,true,true);
            break;  
        case "Sheffield" :
            prefix = "SH";
            showExportOptions(true,false,false);
            break;
        case "StHelens" :
            prefix = "ST";
            showExportOptions(true,false,false);
            break;
        case "TeesValley" :
            prefix = "TV";
            showExportOptions(true,false,false);
            break;
    }
    // Set the prefix
    $("#Membership_number").val(prefix);
}

/**
 * Accepts a select object from the FeeTable containing the orginisation name
 *    and then puts the appropiate ranks into the corresponding rank select
 * @param {Object} e The calling select object
 */
function setRanks(e) {
    var seqID, rankID, objRank, schoolIndex, ranks, option, baseRanks;
    
    // Clear the over-ride checkbox if set
    setOverRide(e, false, false);
    
    seqID = getSequenceNumber(e);

    //Now get the object for the rank dropdown
    rankID = "orgRankID" + seqID;

    clearOptions(rankID);

    //Now we have the object ID lets add an option	
    if (e.value.indexOf("Mage") !==-1) { // Sort out the Mages as they're possibly the most complex
        //schoolIndex 0 = Generalist, 1 = Enchanter, 2 = Necromancer, 3 = Demonologist		
        if (e.value.indexOf("General") !==-1) {
            schoolIndex = 0;
        } else if (e.value.indexOf("Enchant") !==-1) {
            schoolIndex = 1;
        } else if (e.value.indexOf("Necro") !==-1) {
            schoolIndex = 2;
        } else if (e.value.indexOf("Demon") !==-1) {
            schoolIndex = 3;
        }
        switch (schoolIndex) {
            case 0 :
                // As all mages are Generalist until they pick a school apprentice to Junior Guildsman goes here
                ranks = ["Select a rank", "Apprentice", "Journeyman", "Junior Guildsman (1st Month)", "Junior Guildsman (2nd Month)", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "High Guildsman (3rd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Guild Senior (3rd Month)", "Master", "Schoolmaster (General)"];
                break;
			
            case 1 :
                ranks = ["Select a rank", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "High Guildsman (3rd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Guild Senior (3rd Month)", "Master", "Schoolmaster (Enchantment)"];
                break;
			
            case 2 :
                ranks = ["Select a rank", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "High Guildsman (3rd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Guild Senior (3rd Month)", "Master", "Schoolmaster (Necromancy)"];
                break;
		
            case 3 :
                ranks = ["Select a rank", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "High Guildsman (3rd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Guild Senior (3rd Month)", "Master", "Schoolmaster (Demonology)", "Keeper of the Seven Secrets"];
                break;
        }
        addRanks(rankID, ranks);
    } else if (e.value.indexOf("Church") !==-1) { // All the churches have the same advance structure so we capture them all here
        if ($("#gender").val() === "male") {
            ranks = ["Select a rank", "Kindred", "Supplicating Devotee", "Supplicating Priest", "Novice (D1)", "Novice (D2)", "Brother (D3 1st Month)", "Brother (D3 2nd Month)", "Brother (D4 1st Month)", "Brother (D4 2nd Month)", "Brother (D5 1st Month)", "Brother (D5 2nd Month)", "Father (D6 1st Month)", "Father (D6 2nd Month)", "Father (D6 3rd Month)", "Father (D7)", "Novice (P1)", "Brother (P2)", "Brother (P3 1st Month)", "Brother (P3 2nd Month)", "Father (P4 1st Month)", "Father (P4 2nd Month)", "Father (P5 1st Month)", "Father (P5 2nd Month)", "Father (P6 1st Month)", "Father (P6 2nd Month)", "Father (P6 3rd Month)", "High Father (P7)", "Defender of the Faith", "Primate", "Ex-Communicant"];
            baseRanks = ["Select a rank", "Kindred", "Supplicating Devotee", "Supplicating Priest", "D1", "D2", "D3 (1st Month)", "D3 (2nd Month)", "D4 (1st Month)", "D4 (2nd Month)", "D5 (1st Month)", "D5 (2nd Month)", "D6 (1st Month)", "D6 (2nd Month)", "D6 (3rd Month)", "D7", "P1", "P2", "P3 (1st Month)", "P3 (2nd Month)", "P4 (1st Month)", "P4 (2nd Month)", "P5 (1st Month)", "P5 (2nd Month)", "P6 (1st Month)", "P6 (2nd Month)", "P6 (3rd Month)", "P7", "Defender of the Faith", "Primate", "Ex-Communicant"];
        } else if ($("#gender").val() === "female" ) {
            ranks = ["Select a rank", "Kindred", "Supplicating Devotee", "Supplicating Priest", "Novice (D1)", "Novice (D2)", "Sister (D3 1st Month)", "Sister (D3 2nd Month)", "Sister (D4 1st Month)", "Sister (D4 2nd Month)", "Sister (D5 1st Month)", "Sister (D5 2nd Month)", "Mother (D6 1st Month)", "Mother (D6 2nd Month)", "Mother (D6 3rd Month)", "Mother (D7)", "Novice (P1)", "Sister (P2)", "Sister (P3 1st Month)", "Sister (P3 2nd Month)", "Mother (P4 1st Month)", "Mother (P4 2nd Month)", "Mother (P5 1st Month)", "Mother (P5 2nd Month)", "Mother (P6 1st Month)", "Mother (P6 2nd Month)", "Mother (P6 3rd Month)", "High Mother (P7)", "Defender of the Faith", "Primate", "Ex-Communicant"];
            baseRanks = ["Select a rank", "Kindred", "Supplicating Devotee", "Supplicating Priest", "D1", "D2", "D3 (1st Month)", "D3 (2nd Month)", "D4 (1st Month)", "D4 (2nd Month)", "D5 (1st Month)", "D5 (2nd Month)", "D6 (1st Month)", "D6 (2nd Month)", "D6 (3rd Month)", "D7", "P1", "P2", "P3 (1st Month)", "P3 (2nd Month)", "P4 (1st Month)", "P4 (2nd Month)", "P5 (1st Month)", "P5 (2nd Month)", "P6 (1st Month)", "P6 (2nd Month)", "P6 (3rd Month)", "P7", "Defender of the Faith", "Primate", "Ex-Communicant"];
        }
        addRanks(rankID, ranks, baseRanks);
    } else {
        switch (e.value) {  // Finally we catch the guilds, Knights and assorted others
            case "Guild - Alchemist" :
                ranks = ["Select a rank", "Apprentice", "Journeyman (1st Month)", "Journeyman (2nd Month)", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "High Guildsman (3rd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Guild Senior (3rd Month)", "Master", "Guild Protector", "Guildmaster"];
                addRanks(rankID, ranks);
                break;		
		
            case "Guild - Blacksmiths" :
                ranks = ["Select a rank", "Apprentice", "Journeyman (1st Month)", "Journeyman (2nd Month)", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Master", "Guild Protector", "Guildmaster"];
                addRanks(rankID, ranks);
                break;
			
            case "Guild - Mercenaries" :
                ranks = ["Select a rank", "Apprentice", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Master", "Guild Protector", "Guildmaster"];
                addRanks(rankID, ranks);
                break;

            case "Guild - Physician" :
                ranks = ["Select a rank", "Apprentice", "Journeyman (1st Month)", "Journeyman (2nd Month)", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Guild Senior (3rd Month)", "Master", "Guild Protector", "Guildmaster"];
                addRanks(rankID, ranks);
                break;

            case "Guild - Scouts" :
                ranks = ["Select a rank", "Apprentice", "Guildsman (1st Month)", "Guildsman (2nd Month)", "High Guildsman (1st Month)", "High Guildsman (2nd Month)", "Guild Senior (1st Month)", "Guild Senior (2nd Month)", "Master", "Guild Protector", "Guildmaster"];
                addRanks(rankID, ranks);
                break;

            case "Guild - Law - Guard" :
                ranks = ["Select a rank", "Junior Guard (1st Month)", "Junior Guard (2nd Month)", "Junior Guard (3rd Month)", "Guard (1st Month)", "Guard (2nd Month)", "Guard Sergeant", "Guardscaptain"];
                addRanks(rankID, ranks);
                break;

            case "Guild - Law - Forester" :
                ranks = ["Select a rank", "Junior Forester (1st Month)", "Junior Forester (2nd Month)", "Junior Forester (3rd Month)", "Forester (1st Month)", "Forester (2nd Month)", "Huntsman", "Huntsmaster"];
                addRanks(rankID, ranks);
                break;
				
            case "Guild - Thief" :
                ranks = ["Select a rank", "Apprentice (1st Month)", "Apprentice (2nd Month)", "Journeyman", "Junior Guildsman (1st Month)", "Junior Guildsman (2nd Month)", "Guildsman (1st Month)", "Guildsman (2nd Month)", "Guild Senior", "Guild Protector", "Guildmaster"];
                addRanks(rankID, ranks);
                break;
							
            case "Crowan Rose" :
                ranks = ["Select a rank", "Novice (D1)" ,"Novice (D2)" ,"Sister (D3 1st Month)" , "Sister (D3 2nd Month)","Sister (D4 1st Month)" ,"Sister (D4 2nd Month)" ,"Sister (D5 1st Month)" ,"Sister (D5 2nd Month)" ,"Mother (D6 1st Month)" ,"Mother (D6 2nd Month)" ,"Mother (D6 3rd Month)" ,"Mother (D7)" ,"Head of Order"];
                // All Roses and Knights are also members of a church
                // This code, and that like it for the Knightly orders below, automatically adds those Church memberships if they don't already exist
                addRanks(rankID, ranks);
                if ( !checkSelectValue("FeeTable", "0", "Church - Crowa") ) { 
                    addFeeRow("FeeTable", "Church - Crowa");
                }
                break;
										
            case "Knight - Black" :
                ranks = ["Select a rank", "Squire (1st Month)", "Squire (2nd Month)", "Errant (1st Month", "Errant (2nd Month)", "Errant (3rd Month)", "Errant (4th Month)", "House (1st Month)", "House (2nd Month)", "Order (1st Month)", "Order (2nd Month)", "Order (3rd Month)", "Leige Knight", "Head of Order", "Chaplain"];
                addRanks(rankID, ranks);
                if ( !checkSelectValue("FeeTable", "0", "Church - Sidhe") ) {
                    addFeeRow("FeeTable", "Church - Sidhe");
                    setSpecificRank ("Church - Sidhe", "Kindred");
                }
                if ( !checkSelectValue("FeeTable", "0", "Church - Kharach") ) {
                    addFeeRow("FeeTable", "Church - Kharach");
                    setSpecificRank ("Church - Kharach", "Kindred");
                }
                break;
											
            case "Knight - Grey" :
                ranks = ["Select a rank", "Squire (1st Month)", "Squire (2nd Month)", "Errant (1st Month", "Errant (2nd Month)", "Errant (3rd Month)", "Errant (4th Month)", "House (1st Month)", "House (2nd Month)", "Order (1st Month)", "Order (2nd Month)", "Order (3rd Month)", "Knight Devout", "Head of Order", "Chaplain"];
                addRanks(rankID, ranks);
                if ( !checkSelectValue("FeeTable", "0", "Church - Sidhe") ) { 
                    addFeeRow("FeeTable", "Church - Sidhe");
                    setSpecificRank ("Church - Sidhe", "Kindred");
                }
                break;
																
            case "Knight - Griffin" :
                ranks = ["Select a rank", "Squire (1st Month)", "Squire (2nd Month)", "Errant (1st Month", "Errant (2nd Month)", "Errant (3rd Month)", "Errant (4th Month)", "House (1st Month)", "House (2nd Month)", "Order (1st Month)", "Order (2nd Month)", "Order (3rd Month)", "Battle Knight", "Head of Order", "Chaplain"];
                addRanks(rankID, ranks);
                if ( !checkSelectValue("FeeTable", "0", "Church - Sidhe") ) { 
                    addFeeRow("FeeTable", "Church - Sidhe");
                    setSpecificRank ("Church - Sidhe", "Kindred");
                }
                if ( !checkSelectValue("FeeTable", "0", "Church - Crowa") ) { 
                    addFeeRow("FeeTable", "Church - Crowa");
                    setSpecificRank ("Church - Crowa", "Kindred");
                }
                break;
	
            case "Knight - Templar" :
                ranks = ["Select a rank", "Squire (1st Month)", "Squire (2nd Month)", "Errant (1st Month", "Errant (2nd Month)", "Errant (3rd Month)", "Errant (4th Month)", "House (1st Month)", "House (2nd Month)", "Order (1st Month)", "Order (2nd Month)", "Order (3rd Month)", "Knight Marshall", "Knight Librarian", "Head of Order", "Chaplain"];
                addRanks(rankID, ranks);
                if ( !checkSelectValue("FeeTable", "0", "Church - Sidhe") ) { 
                    addFeeRow("FeeTable", "Church - Sidhe");
                    setSpecificRank ("Church - Sidhe", "Kindred");
                }
                break;
																				
            case "Populace" :
                ranks = ["Select a rank", "Slave", "Serf", "Retainer", "Senechal", "Baronet"];
                addRanks(rankID, ranks);
                break;
																				
            case "Council" :  // This option exists to hold people who can come from one of a number of guilds or churches
                ranks = ["Select a rank", "High Primate", "Knight Commander", "Lord Mayor", "Chief Justice", "Archmage", "Witchfinder", "Judge - No Court", "Judge - Held Court", "Magistrate - No Court", "Magistrate - Held Court"];
                addRanks(rankID, ranks);
                break;
								
            default :
                ranks = ["Select a rank"];
                addRanks(rankID, ranks);
        }
    }
    // Ensure the rank selector always shows the default option to begin with
    $("#" + rankID).selectOptions("Select a rank")
}

/**
 * Accepts a select object from the FeeTable containing the rank select
 *     It then determines the appropiate fees or tithe and outputs 
 *     into the relevant input boxes.
 * @param {Object} e The calling rank select object
 * @returns {Int} pay The amount of guild pay (as opposed to fees)
 */
function setFees(e) {
	
    var seqID, orgSelectID, rankID, crownsID, penniesID;
    var objOrgSelect, objRank, inCrown, inPennies, totalIn, crowns;
    var pennies, fees, t12, t50, t80, payFlag, rankNumber, roseRemains;
    var roseExpenses, roseOrder, churchRank, pay;
    
    // Calculates and inputs fees for those classes we know about
    seqID = getSequenceNumber(e);
    payFlag = 0; //Set this flag to FALSE
    //Now get the object for the various selects and text boxes we need
    orgSelectID = "orgID" + seqID;
    rankID = "orgRankID" + seqID;
    crownsID = "orgFeesCrownsID" + seqID;
    penniesID = "orgFeesPenniesID" + seqID;
    objOrgSelect = $("#" + orgSelectID)[0];
    objRank = $("#" + rankID)[0];

    // Get our total income
    inCrown = parseInt($("#incomeCrowns").val(), 10) + parseInt($("#guildIncomeCrowns").text(), 10); // Income fields
    inPennies = parseInt($("#incomePennies").val(), 10) + parseInt($("#guildIncomePennies").text(), 10);
    totalIn = (inCrown*12) + inPennies;
	
    // A few handy local variables
    fees = ["0", "0"];
	
    // Lets do Churches First
    if (objOrgSelect.value.indexOf("Church") !==-1) {
        // What Tithe needs to be paid
        if (objRank.value.indexOf("Kindred") !==-1) {
            t12 = Math.round(totalIn*0.08333);
            fees[0] = to_crown(t12);
            fees[1] = dec_to_penny(t12);
        } else if (objRank.value.indexOf("D") !==-1) { //Oddly this covers Defender of the Faith and supplicant devs as well as they contains the D
            t50 = Math.round(totalIn*0.5);
            fees[0] = to_crown(t50);
            fees[1] = dec_to_penny(t50);
        } else if (objRank.value.indexOf("P") !==-1) { // Works for Primate and supplicant priests too
            t80 = Math.round(totalIn*0.75);
            fees[0] = to_crown(t80);
            fees[1] = dec_to_penny(t80);
        } else if (objRank.value.indexOf("Ex") !==-1) {// Excom scum
            fees[0] = 0;
            fees[1] = 0;
        }
    } else if (objOrgSelect.value.indexOf("Mercen") !==-1 || objOrgSelect.value.indexOf("Scouts") !==-1) { // Work out which guild we are dealing with
        rankNumber = getRank(objRank);
        fees = getGuildFees("MS", rankNumber);
    } else if (objOrgSelect.value.indexOf("Blacksmiths") !== -1) {
        rankNumber = getRank(objRank);
        fees = getGuildFees("BS", rankNumber);
    } else if (objOrgSelect.value.indexOf("Physician") !== -1) {
        // Physicans have a special deal with the Vleyborian church
        //    first check if this person is a member of the Church
        if (checkSelectValue("FeeTable", "0", "Church - Vleybor")){
            //Physican is a member of the Vleyborian church
            // Get what their fees would be anyway
            rankNumber = getRank(objRank);
            fees = getGuildFees("PS", rankNumber);
            // Now get their rank in the Church
            churchRank = getSpecificRank("FeeTable", "0", "Church - Vleybor");
            if (churchRank.indexOf("Kindred") !==-1) {
                // Kindred pay 11/12ths of the fees
                t12 = Math.round(((parseInt((fees[0]*12),10)+ parseInt(fees[1],10))*0.916666));
                fees[0] = to_crown(t12);
                fees[1] = dec_to_penny(t12);
            } else if (churchRank.indexOf("D") !==-1) { //Oddly this covers Defender of the Faith and supplicant devs as well as they contains the D
                t50 = Math.round(((parseInt((fees[0]*12),10)+ parseInt(fees[1],10))*0.5));
                fees[0] = to_crown(t50);
                fees[1] = dec_to_penny(t50);
            } else if (churchRank.indexOf("P") !==-1) { // Works for Primate and supplicant priests too
                t80 = Math.round(((parseInt((fees[0]*12),10)+ parseInt(fees[1],10))*0.25));
                fees[0] = to_crown(t80);
                fees[1] = dec_to_penny(t80);
            }
        } else {
            // Not a church member, regular fees
            rankNumber = getRank(objRank);
            fees = getGuildFees("PS", rankNumber);
        }
    } else if (objOrgSelect.value.indexOf("Mage") !== -1) {
        rankNumber = getRank(objRank);
        fees = getGuildFees("MG", rankNumber);
    } else if (objOrgSelect.value.indexOf("Alchemist") !== -1) {
        rankNumber = getRank(objRank);
        fees = getGuildFees("AL", rankNumber);
    } else if (objOrgSelect.value.indexOf("Thief") !== -1) {
        rankNumber = getRank(objRank);
        fees = getGuildFees("TL", rankNumber);
    } else if (objOrgSelect.value.indexOf("Law") !== -1) {
        payFlag = 1; //Set to TRUE
        if (objRank.value.indexOf("Junior") !== -1) {
            fees = getGuildFees("Law", "0");
        } else if (objRank.value.indexOf("Sergeant") !== -1 || objRank.value.indexOf("Huntsman") !== -1) { //needs to come first as GS contains G
            fees = getGuildFees("Law", "6");
        } else if (objRank.value.indexOf("captain") !== -1 || objRank.value.indexOf("Huntsmaster") !== -1) {
            fees = getGuildFees("Law", "8");
        } else if (objRank.value.indexOf("Guard") !== -1 || objRank.value.indexOf("Forester") !== -1) { //Guards and foresters have the same pay scale
            fees = getGuildFees("Law", "3");
        }
    } else if (objOrgSelect.value.indexOf("Council") !== -1 ) {
        if (objRank.value.indexOf("Judge - Held Court") !== -1) {
            payFlag = 1; // Set to True
            fees[0] = "5";
            fees[1] = "0";
        } else if (objRank.value.indexOf("Magistrate - Held Court") !== -1 ) {
            payFlag = 1; // Set to True
            fees[0] = "3";
            fees[1] = "0";
        } 
    } else if (objOrgSelect.value.indexOf("Crowan Rose") !== -1 ) {  // Onward to the Knighthoods.  First the Roses
        // First we tithe as a Dev
        t50 = Math.round(totalIn*0.5);
        // Next we subtract 2/0 for Novices, 3/0 for Sisters and 4/0 for Mothers
        if ( objRank.value.indexOf("Novice") !== -1 ) { // Novice Roses
            roseRemains = parseInt(totalIn, 10) - parseInt(t50, 10); // How much income is left after our tithe
            if ( parseInt(roseRemains, 10) <= 24 ) {
                roseExpenses = parseInt(roseRemains, 10);
            } else {
                roseExpenses = 24;
            }
        } else if ( objRank.value.indexOf("Sister") !== -1) { // Sister Roses
            roseRemains = parseInt(totalIn, 10) - parseInt(t50, 10); // How much income is left after our tithe
            if ( parseInt(roseRemains, 10) <= 36 ) {
                roseExpenses = parseInt(roseRemains, 10);
            } else {
                roseExpenses = 36;
            }
        } else if ( objRank.value.indexOf("Mother") !== -1 || objRank.value.indexOf("Head of Order") !== -1 ) { // Mother Roses
            roseRemains = parseInt(totalIn, 10) - parseInt(t50, 10); // How much income is left after our tithe
            if ( parseInt(roseRemains, 10) <= 48 ) {
                roseExpenses = parseInt(roseRemains, 10);
            } else {
                roseExpenses = 48;
            }
        }
        // Populate the expenses
        $("#otherCrowns").val(to_crown(roseExpenses));
        $("#otherPennies").val(dec_to_penny(roseExpenses));
        // What's left over goes to the order
        roseOrder = t50 - roseExpenses;
        if ( roseOrder >= 0) {
            fees[0] = to_crown(roseOrder);
            fees[1] = dec_to_penny(roseOrder);
        } else {
            fees[0] = 0;
            fees[1] = 0;
        }
        // Set the Crowan Church rank to match ours
        roseRankMatch(objRank);
    } else if (objOrgSelect.value.indexOf("Knight - Black") !== -1 || objOrgSelect.value.indexOf("Knight - Griffin") !== -1 ) {  // Now the Griffins and Blacks because they are simple
        // All ranks tithe as a Dev to the Order
        // Assume the player will put in that they are kin to relevant Gods and let the form work out that tithe
        // Check to see if they are the chaplain, Heads as a seperate zero tithe line for information
        if ( objRank.value.indexOf("Chaplain") !== -1 || objRank.value.indexOf("Head of Order") !== -1 ) {
            fees[0] = 0;
            fees[1] = 0;
        } else {
            t50 = Math.round(totalIn*0.5);
            fees[0] = to_crown(t50);
            fees[1] = dec_to_penny(t50);
        }
    } else if ( objOrgSelect.value.indexOf("Knight - Grey") !== -1 ) { // Grey Knights next
        //Tithe like a Grey
        // Most of them tithe like a Dev except for Knight Devouts
        if ( objRank.value.indexOf("Chaplain") !== -1 || objRank.value.indexOf("Head of Order") !== -1 ) {  // Chaplains pay no tithe, Heads can come from any rank so are a seperate line
            fees[0] = 0;
            fees[1] = 0;
        } else if ( objRank.value.indexOf("Devout") !== -1 ) { // Knight Devouts are speical
            // Right, Devouts pay half to the Order, half to the Church.  Kin of Sidhe will send 1/12 of that Church wise, we just need to take care of the remaining 11/12
            // first work out the kin tithe
            t12 = Math.round(totalIn*0.08333);
            // Then the rest goes to the Order / Church
            fees[0] = to_crown(totalIn - t12);
            fees[1] = dec_to_penny(totalIn - t12);			
        } else { // Everyone else tithes like a Dev
            t50 = Math.round(totalIn*0.5);
            fees[0] = to_crown(t50);
            fees[1] = dec_to_penny(t50);
        }
    } else if ( objOrgSelect.value.indexOf("Knight - Templar") !== -1 ) { // Finally the Templar order
        //Tithe like a Templar knight
        if ( objRank.value.indexOf("Chaplain") !== -1 || objRank.value.indexOf("Head of Order") !== -1 ) {  // Chaplains pay no tithe, Heads can come from any rank so are a seperate line
            fees[0] = 0;
            fees[1] = 0;
        } else {
            // Everyone else tithes 8/12 to the Order
            t12 = Math.round(totalIn*0.08333); // calculate 1/12
            t12 = t12 * 2; // Double up for 2/12
            fees[0] = to_crown(totalIn - t12);
            fees[1] = dec_to_penny(totalIn - t12);
        }
    }
	
    // Finally done, now just output the values to the form
    if (payFlag) {
        pay = (parseInt(fees[0], 10)*12) + parseInt(fees[1], 10); //Return the pay amount in pennies
    } else {
        $("#" + crownsID).val(fees[0]);
        $("#" + penniesID).val(fees[1]);
        pay = "0"; // No pay for this guild so return a 0
    }
    return pay; // Return the pay amount whatever it is
}

/**
 * Iterate through the Rank selects calling the setFees function on each of them
 *   If setFees returns a pay amount total that up and display the total amount
 * @returns true or false depending on the outcome
 */
function checkFees() {
    var tableName, iRowCount, iCurrentRow, oTable, oRow, oCell;
    var oSelect, oCheck, pay;
	
    tableName = "FeeTable";
    pay = "0"; // Initalise at Zero
	
    oTable = $("#FeeTable");
    // Make sure we can get a reference to the tables
    if (oTable === null){	
        return false;
    }
    
    iRowCount = $('#' + tableName + ' tr').length; // using jQuery for FireFox
    for(iCurrentRow = 1; iCurrentRow < iRowCount; iCurrentRow++) { // Adjust iCurrentRow to start at 1 to avoid header row				
        // Get the column using jQuery for compatability with FireFox
        oRow = $('#' + tableName +' tr:eq(' + iCurrentRow + ')');
        // Check if the over ride button is set
        oCell = $(oRow).find("td").eq('5');
        oCheck = $(oCell).find("input:checkbox");
        if ($(oCheck['0']).is(':checked')){
            continue;  // Skip this iteration
        }
        oCell = $(oRow).find("td").eq('1');
        oSelect = $(oCell).find("select");
        pay = parseInt(pay, 10) + parseInt(setFees(oSelect['0']), 10);
        oCell = null;
    }
    if (pay !== "0"){
        // Display the pay
        $("#guildIncomeCrowns").text(to_crown(pay));
        $("#guildIncomePennies").text(dec_to_penny(pay));
    }
    return true;
}

/**
 * Called when the user presses the 'Calculate the maths' button
 *   Pretty much does what it says on the tin.  Performs all the relevant 
 *   returns math for the user
 *   @param {Object} e The calling item
 */
function totFees(e)
{
    // Pre define all our variables
    var totalFeesCrowns, totalFeesPennies, exCrowns, exPennies, inCrowns;
    var inPennies, startCrowns, startPennies, totalFees, totalIn, totalInI;
    var penny, totalExp, balance, balanceI, guildPayCrowns, guildPayPennies;
    
    // Clear the overide checkbox if set and we were passed an object
    //  This only happens if called from the rank select onChange which means
    //      that the override checkbox must be cleared
    if (typeof e !== "undefined") {
        setOverRide(e, false, false);
    }
    
    // Before we do the final calulations we want to force a re-calculation of any tithes and fees, just in case
    checkFees();
	
    // Stupid forms have to convert form text values to numbers
    totalFeesCrowns = totalTableColumn("FeeTable",2);
    totalFeesPennies = totalTableColumn("FeeTable",3);
    exCrowns = parseInt($("#otherCrowns").val(), 10);  // Other expenditure
    exPennies = parseInt($("#otherPennies").val(), 10);
    inCrowns = parseInt($("#incomeCrowns").val(), 10); // Income fields
    inPennies = parseInt($("#incomePennies").val(), 10);
    startCrowns = parseInt($("#startCrowns").val(), 10); // Starting balance fields
    startPennies = parseInt($("#startPennies").val(), 10);
    guildPayCrowns = parseInt($("#guildIncomeCrowns").text(), 10);
    guildPayPennies = parseInt($("#guildIncomePennies").text(), 10);
    // Adds up all the fees & expenditure crowns and pennies to get total pennies to work with
    totalFees = (totalFeesCrowns*12) + totalFeesPennies;
    totalFeesCrowns = to_crown(totalFees); // Call the convert a penny value to crowns function
    $("#totalFeesCrowns").text(totalFeesCrowns); // Places the Total Expenditure Crown value on the form
    totalFeesPennies = dec_to_penny(totalFees);  // Call function to calculate penny value
    $("#totalFeesPennies").text(totalFeesPennies); // Places the Total Expenditure penny value on the form
    // Adds up start balance and total income and displays on form (only the mission income and guild income as per Secs statement)
    totalIn = (inCrowns*12) + inPennies + (guildPayCrowns * 12) + guildPayPennies;
    totalInI = to_crown(totalIn); // Call the convert a penny value to crowns function
    $("#totalIncomeCrowns").text(totalInI); // Places the Total Income Crown value on the form
    penny = dec_to_penny(totalIn);  // Call function to calculate penny value
    $("#totalIncomePennies").text(penny); // Places the Total Income penny value on the form
    // Using above total incomes and total expenditure to come up with a balance
    totalExp = totalFees + (exCrowns * 12) + exPennies;
    balance = (totalIn + (startCrowns*12) + startPennies) - totalExp;  // Incorporate the starting balance in the final calculation
    balanceI = to_crown(balance); // Call the convert a penny value to crowns function
    $("#balanceCrowns").text(balanceI); // Places the Balance Crown value on the form
    penny = dec_to_penny(balance);  // Call function to calculate penny value
    $("#balancePennies").text(penny); // Places the Balance penny value on the form
    // Now set all our hidden fields
    $("#hiddenGuildIncomeCrowns").val(guildPayCrowns);
    $("#hiddenGuildIncomePennies").val(guildPayPennies);
    $("#hiddenTotalIncomeCrowns").val(totalInI);
    $("#hiddenTotalIncomePennies").val(dec_to_penny(totalIn)); //because Penny is reused above
    $("#hiddenBalanceCrowns").val(balanceI);
    $("#hiddenBalancePennies").val(dec_to_penny(balance)) //because Penny is reused above
}

// The following functions display help information in the right hand column

/*
 * Displays information in the right column from external HTML files
 * @param {String} fileName the name of the external HTML file to open without
 *      its extension
 */
function about(fileName){
    fileName = "include/help/" + fileName + ".html";
    $.get(fileName,
        function (data){
            $("div.col3").html(data);
        });
}