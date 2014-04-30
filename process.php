<?php

// Script to process our form output
// v1.6b
// This version simply takes the form values, loads them into an multi-dimensional array and then spits them back out to the browser in CSV format

/* The form returns the following variables held as key value pairs in $_POST;
  Player_name : string, does what it says on the tin
  recipient : string, Which branch the member comes from
  Membership_number: string
  Character_name : string
  Character_Race : string
  Month : string
  Start_balance_crowns : int
  Start_balance_pennies : int
  Income_crowns : int
  Income_pennies : int
  Other_Expense_crowns: int
  Other_Expense_crowns: int
  Org : array of strings, holds what guilds / churches the member is in
  Rank : array of strings, indexed to match Org, lists their rank in that guild or church
  Fees_Crowns : array of ints, indexed to match Org
  Fees_Pennies : array of ints, indexed to match Org
  AdvanceID :in, the index of the Org they wish to advance in
  Guild_income_crowns : int
  Guild_income_pennies : int
  Total_income_crowns : int
  Total_income_pennies : int
  Balance_crowns : int
  Balance_pennies : int
  adventureBranch : array of strings
  adventureNumber : array of ints, indexed to match adventureBranch
  magicItemNumber: array of strings
  magicItemName : array of strings, indexed to match magicItemNumber
  formAction : radio button determining what to do with the input
  rememberMe : Checkbox to determine if to set a cookie or not
 */

/* The output CSV format expects 15 columns: in the following order:
  Member Number, Character Status, Player name, Character name, Race, End Balance, Total Income, Guild/Church, Rank, Fee/Tithe, Advance, Number of Missions, Mission location, Magic item number, magic item name

  All monetary values are expressed as Crowns/Pennies
  All fields except Character Status are provided in the form.  As the player has submitted a return we will assume this field is always 'Active'

  The fields are broken into two types: One off and repeating
  One offs :-
  Member Number, Character Status, Player name, Character name, Race, End Balance, Total Income; appear once in the first row of data.  Subsquent rows should have blank columns in these locations
  Repeating :-
  Guild/Church, Rank, Fee/Tithe, Advance, Number of Missions, Mission location, Magic item number, magic item name; are all repeating data and appear in as many rows as their are entries to display
 */
// Include the Zend gData library
$clientLibraryPath = 'E:\\Domains\\x\\xyleth.co.uk\\user\\htdocs\\returns\\include\\PHP\\library\\';
$oldPath = set_include_path(get_include_path() . PATH_SEPARATOR . $clientLibraryPath);

$includeLibraryPath = "$_SERVER[DOCUMENT_ROOT]\\returns\\include\\PHP\\";
$oldPath = set_include_path(get_include_path() . PATH_SEPARATOR . $includeLibraryPath);

include_once("Google_Spreadsheet.php");

// First check if we have to set any cookies
if (array_key_exists("rememberMe", $_POST)) {
    //set cookies
    // First extract our Arrays
    $endBalance = ($_POST["Balance_crowns"] * 12) + $_POST["Balance_pennies"];

    // Information we need to store in the cookie: Player Name, Player Branch, Membership number, Charater name, Race, Final balance, gender, Guild / Church memberships, Magic items
    // First we stick Player Name, Player Branch, Membership number, Charater name, Race, Final balance and gender into a single array and JSON it
    $basicData = array($_POST["Player_name"], $_POST["recipient"], $_POST["Membership_number"], $_POST["Character_name"], $_POST["Character_Race"], $endBalance, $_POST["gender"]);
    $expiry = time() + 60 * 60 * 24 * 95; // Set Cookie expiry value to 95 days (the last number)
    //setrawcookie("basicInfo", rawurlencode(json_encode($basicData)), $expiry, "", "www.xyleth.co.uk");
    setcookie("basicInfo", json_encode($basicData), $expiry, "", "www.xyleth.co.uk");
    setcookie("orgNames", json_encode($_POST["Org"]), $expiry, "", "www.xyleth.co.uk");
    setcookie("orgRanks", json_encode($_POST["Rank"]), $expiry, "", "www.xyleth.co.uk");
    if (array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        setcookie("itemNumber", json_encode($_POST["magicItemNumber"]), $expiry, "", "www.xyleth.co.uk");
        setcookie("itemName", json_encode($_POST["magicItemName"]), $expiry, "", "www.xyleth.co.uk");
    }
}

// Decide what we are going to do

switch ($_POST["formAction"]) {
    case "csv" :
        outputCSV();
        break;
    case "narrative" :
        outputNarrative(false);
        break;
    case "gdoc" :
        outputGoogle();
        break;
    default :
        outputNarrative(false);
}

/**
 * This function outputs the submitted form data to a Google docs spread sheet
 *    Which spreadsheet it uses depends on which branch is picked
 */
function outputGoogle() {
    // Check to see if the Branch has a spread sheet set up
    $sheetName = "none";
    switch ($_POST["recipient"]) {
        case "Bath" :
            $sheetName = "none";
            break;
        case "BlackCountry" :
            $sheetName = "none";
            break;
        case "Bolton" :
            $sheetName = "none";
            break;
        case "Bristol" :
            $sheetName = "none";
            break;
        case "Cardiff" :
            $sheetName = "none";
            break;
        case "Derby" :
            $sheetName = "none";
            break;
        case "Edinburgh" :
            $sheetName = "none";
            break;
        case "Guildford" :
            $sheetName = "none";
            break;
        case "Hull" :
            $sheetName = "none";
            break;
        case "Independent" :
            $sheetName = "none";
            break;
        case "Leeds" :
            $sheetName = "none";
            break;
        case "Leicester" :
            $sheetName = "none";
            break;
        case "Maidenhead" :
            $sheetName = "none";
            break;
        case "Newcastle":
            $sheetName = "none";
            break;
        case "Nottingham" :
            $sheetName = "none";
            break;
        case "Norwich" :
            $sheetName = "none";
            break;
        case "Oxford" :
            $sheetName = "none";
            break;
        case "Portsmouth" :
            $sheetName = "PortsmouthReturns";
            break;
        case "Sheffield" :
            $sheetName = "none";
            break;
        case "StHelens" :
            $sheetName = "none";
            break;
        case "TeesValley" :
            $sheetName = "none";
            break;
        default :
            $sheetName = "none";
    }
    
    // If there is no sheet set up tell the user, output a narrative export
    // and exit
    if ($sheetName === "none") {
        print "<h1>We're sorry</h1><br>";
        print "Your branch does not yet have a Google Docs return Spreadsheet.";
        print "  Until one can be arranged a narrative output is below that you";
        print " can send to your LO.";
        print "<br><hr>";
        outputNarrative(false);
        return;
    }

    // output some Blurb to the user
    
    print "<h1>Return form Google Documents Export</h1><br>";
    print "Your submitted form data has been saved to a Google documents ";
    print "spread sheet that your LO has access to.<Br>";
    print "<br><b>Please check with your LO that they are happy to recieve ";
    print "returns in this manner before using this option!</b><br>";
    print "<br><hr>";
    
    // Some spread sheet setup
    $u = "fnhReturns@gmail.com";
    $p = "pyzajneanEwn";

    $ss = new Google_Spreadsheet($u, $p);
    $ss->useSpreadsheet($sheetName);

    // We will use this ID column later so we can group entries made at the
    //    same time.
    $id = "z" . md5(microtime(true)); 

    // The first thing we need to do is work out how many rows of data we are 
    //     going to need.  This will always be a minimium of 1
    $numRows = "1"; // The default value
    if (!array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        $varRetFieldsLength = array(count($_POST["Org"]), count($_POST["adventureBranch"]));  // no magic items so these two arrays determine the base index for the repeat fields
        sort($varRetFieldsLength);  // Puts the largest number into position 1
        $numRows = $varRetFieldsLength[1];
    } else {
        $varRetFieldsLength = array(count($_POST["Org"]), count($_POST["adventureBranch"]), count($_POST["magicItemNumber"]));  // these three arrays determine the base index for the repeat fields
        sort($varRetFieldsLength);  // Puts the largest number into position 2
        $numRows = $varRetFieldsLength[2];
    }
    // Lets set up some global vars to use elsewhere in the script
    $playerStatus = "Active"; //As they submitted a return, assume they are an active player
    $endBalance = ($_POST["Balance_crowns"] * 12) + $_POST["Balance_pennies"];  // Put our balances into Pennies for insertion into Justin's spreadsheet.
    $totalIncome = ($_POST["Total_income_crowns"] * 12) + $_POST["Total_income_pennies"];
    $orgArray = $_POST["Org"];
    $orgRankArray = $_POST["Rank"];
    $feeCrownsArray = $_POST["Fees_Crowns"];
    $feePenniesArray = $_POST["Fees_Pennies"];
    $returnMonth = $_POST["Month"];
    if (array_key_exists("AdvanceID", $_POST)) { // Check for no advance
        $advanceID = $_POST["AdvanceID"] - 1; //Convert to match 0 index
    } else {
        $advanceID = 9999; // Set a stupidly huge number that will never match the number of Orgs you can belong to
    }
    for ($advID = 0; $advID < $numRows; $advID++) { // Build an advanceArray with the * at the appropiate point
        if ($advanceID === $advID) {
            $advanceArray[$advID] = "*";
        } else {
            $advanceArray[$advID] = " ";
        }
    }
    $adventureArray = $_POST["adventureBranch"];
    $adventureNumArray = $_POST["adventureNumber"];
    if (array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        $magicItemNumArray = $_POST["magicItemNumber"];
        $magicItemArray = $_POST["magicItemName"];
    }
    // Remembering that our array goes ID, Month, Member Number, Character Status, Player name, Character name, Race, End Balance, Total Income, Guild/Church, Rank, Fee/Tithe, Advance, Number of Missions, Mission location, Magic item number, magic item name
    $rowCount = 0;  // This is our counter for which row we are working on

    if (!array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        $rowData = array(
            "ID" => $id.$rowCount, 
            "Month" => $returnMonth, 
            "Member No." => $_POST["Membership_number"],
            "Character status" => $playerStatus,
            "Player Name" => $_POST["Player_name"], 
            "Character name" => $_POST["Character_name"],
            "Race" => $_POST["Character_Race"], 
            "End Balance" => $endBalance,
            "Total Income" => $totalIncome,
            "Guild/Church" => $orgArray[$rowCount],
            "Rank" => $orgRankArray[$rowCount],
            "Fee/Tithe" => ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount],
            "Advance?" => $advanceArray[$rowCount],
            "No. Missions" => $adventureNumArray[$rowCount],
            "Mission locations" => $adventureArray[$rowCount],
            "Magic Item No." => " ",
            "Magic Item Name" => " ");
    } else {
        $rowData = array(
            "ID" => $id.$rowCount, 
            "Month" => $returnMonth, 
            "Member No." => $_POST["Membership_number"],
            "Character status" => $playerStatus,
            "Player Name" => $_POST["Player_name"], 
            "Character name" => $_POST["Character_name"],
            "Race" => $_POST["Character_Race"], 
            "End Balance" => $endBalance,
            "Total Income" => $totalIncome,
            "Guild/Church" => $orgArray[$rowCount],
            "Rank" => $orgRankArray[$rowCount],
            "Fee/Tithe" => ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount],
            "Advance?" => $advanceArray[$rowCount],
            "No. Missions" => $adventureNumArray[$rowCount],
            "Mission locations" => $adventureArray[$rowCount],
            "Magic Item No." => $magicItemNumArray[$rowCount],
            "Magic Item Name" => $magicItemArray[$rowCount]);
    }
    // Publish this row to Google
    if ($ss->addRow($rowData)) {
        echo "Form data row $rowCount successfully stored <br>";
    } else {
        echo "Error, unable to store data <br>";    
    }
    
    // Now we've done the first row we follow on to any subsquent rows
    // That is the first row down.  Now we need to do the rest
    for ($rowCount = 1; $rowCount < $numRows; $rowCount++) {
        // First check if our key arrays contain any data and build up some
        //    sub arrays for use later
        if (!array_key_exists($rowCount, $orgArray)) {
            $orgDetails = array(" ", " ", " ", " ");
        } else {
            if (!array_key_exists($rowCount, $advanceArray)) {
                $orgDetails = array($orgArray[$rowCount], $orgRankArray[$rowCount], ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount], " ");
            } else {
                $orgDetails = array($orgArray[$rowCount], $orgRankArray[$rowCount], ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount], $advanceArray[$rowCount]);
            }
        }

        if (!array_key_exists($rowCount, $adventureArray)) {
            $adventureDetails = array(" ", " ");
        } else {
            $adventureDetails = array($adventureNumArray[$rowCount], $adventureArray[$rowCount]);
        }

        if (isset($magicItemNumArray)) {
            if (!array_key_exists($rowCount, $magicItemNumArray)) {
                $magicItemDetails = array(" ", " ");
            } else {
                $magicItemDetails = array($magicItemNumArray[$rowCount], $magicItemArray[$rowCount]);
            }
        } else {
            $magicItemDetails = array(" ", " ");
        }
        // now we have the relevant data build our row
        $rowData = array(
            "ID" => $id.$rowCount, 
            "Month" => $returnMonth, 
            "Member No." => " ",
            "Character status" => " ",
            "Player Name" => " ", 
            "Character name" => " ",
            "Race" => " ", 
            "End Balance" => " ",
            "Total Income" => " ",
            "Guild/Church" => $orgDetails[0],
            "Rank" => $orgDetails[1],
            "Fee/Tithe" => $orgDetails[2],
            "Advance?" => $orgDetails[3],
            "No. Missions" => $adventureDetails[0],
            "Mission locations" => $adventureDetails[1],
            "Magic Item No." => $magicItemDetails[0],
            "Magic Item Name" => $magicItemDetails[1]);
        // Array built, add it to google
        if ($ss->addRow($rowData)) {
            echo "Form data row $rowCount successfully stored <br>";
        } else {
            echo "Error, unable to store data <br>";
        }
    }
    print "<br><hr>";
    print "<br>For your reference a narrative output follows below the line.  ";
    print "You do not need to do anything further, this is for reference only.";
    print "<br><hr>";
    outputNarrative(true);    
}

/**
 *
 * @param type $postGoogle Bool varialbe to control display of some explanatory
 *     text if this function is being called after the Google export
 */
function outputNarrative($postGoogle) {
    if (!isset($postGoogle)) {
        $postGoogle = false;
    }
    // First some useful vars for the function
    $orgArray = $_POST["Org"];
    $orgRankArray = $_POST["Rank"];
    $feeCrownsArray = $_POST["Fees_Crowns"];
    $feePenniesArray = $_POST["Fees_Pennies"];
    // Change advance on to Yes
    $adventureArray = $_POST["adventureBranch"];
    $adventureNumArray = $_POST["adventureNumber"];
    if (array_key_exists("AdvanceID", $_POST)) { // Check for no Advance
        $advanceID = $_POST["AdvanceID"] - 1; //Convert to match 0 index
    } else {
        $advanceID = 9999; // Set a stupidly huge number that will never match the number of Orgs you can belong to
    }
    if (array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        $magicItemNumArray = $_POST["magicItemNumber"];
        $magicItemArray = $_POST["magicItemName"];
    }
    $lineEnd = "<br>";
    // Some explanatory text
    if ($postGoogle) {
        print "<h1>Return form Narrative output for refernce only</h1>".$lineEnd."<hr>";        
    } else {
        $lineEnd="\r\n";
        header('Expires: 0');
        header('Cache-control: private');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Content-Description: File Transfer');
        header('Content-Type: text/txt');
        header('Content-disposition: attachment; filename=' . $_POST["Player_name"] . '_' . $_POST["Month"] . '_' . Date("Y") . '_return.txt');
        print "Return form Narrative output".$lineEnd;
        print "To use this output copy and paste everything below the line into an e-mail and send to your LO".$lineEnd;
        print "COPY EVERYTHING BELOW THIS LINE".$lineEnd.$lineEnd;
    }  

    // Now we just print out the data.  First the basics
    print "Hello, my name is " . $_POST["Player_name"] . " and my membership number is " . $_POST["Membership_number"] . ".".$lineEnd;
    print "My Character is called " . $_POST["Character_name"] . " and they are a " . $_POST["Character_Race"] . ".".$lineEnd;
    print "This return is for the month of " . $_POST["Month"] . ".".$lineEnd.$lineEnd;
    // Money matters
    print "My final balance for the month is " . $_POST["Balance_crowns"] . "/" . $_POST["Balance_pennies"] . $lineEnd;
    print "My total income for the month is " . $_POST["Income_crowns"] . "/" . $_POST["Income_pennies"] .$lineEnd.$lineEnd;
    // Church and Guild matters
    $numOrgs = count($orgArray);
    for ($orgCount = 0; $orgCount < $numOrgs; $orgCount++) {
        print "I am a member of " . $orgArray[$orgCount] . " and I have the rank of " . $orgRankArray[$orgCount] . ". I paid fees / tithes of " . $feeCrownsArray[$orgCount] . "/" . $feePenniesArray[$orgCount];
        if ($advanceID === $orgCount) {
            print " and I wish to advance in this Church / Guild.".$lineEnd;
        } else {
            print $lineEnd;
        }
    }
    print $lineEnd;
    // Adventure matters
    $numAdventures = count($adventureArray);
    for ($advCount = 0; $advCount < $numAdventures; $advCount++) {
        print "I adventured at " . $adventureArray[$advCount] . " branch " . $adventureNumArray[$advCount] . " time(s) this month.".$lineEnd;
    }
    print $lineEnd;
    // Magic item details
    if (array_key_exists("magicItemNumber", $_POST)) {
        $numItems = count($magicItemArray);
        for ($itemCount = 0; $itemCount < $numItems; $itemCount++) {
            print "I have magic item " . $magicItemArray[$itemCount] . " which is number " . $magicItemNumArray[$itemCount] .$lineEnd;
        }
    }
}

function outputCSV() {
    // Some explanatory text for the user first
    /*
    print "<h1>Return form CSV Output</h1><br>";
    print "To use copy and paste everything below the line into a text document (use notepad) and save with the .csv extension<br>";
    print "Then e-mail the CSV file to your LO who can open it in Excel and copy / paste it straight into their master return spreadsheet<br>";
    print "Note that your financial figures are expressed in pennies not in the crown/penny notation.  This has been checked and approved with the Secretary and won't cause any problems<br>";
    print "Please check with your LO that they are okay with reciving returns in this format before sending!<br>";
    print "<br>COPY EVERYTHING BELOW THIS LINE<br><hr>";
    */
    header('Expires: 0');
    header('Cache-control: private');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Content-Description: File Transfer');
    header('Content-Type: text/csv');
    header('Content-disposition: attachment; filename='.$_POST["Player_name"].'_'.$_POST["Month"].'_'.Date("Y").'_return.csv');
    // The first thing we need to do is work out how many rows of data we are going to need.  This will always be a minimium of 1
    $numRows = "1"; // The default value
    if (!array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        $varRetFieldsLength = array(count($_POST["Org"]), count($_POST["adventureBranch"]));  // no magic items so these two arrays determine the base index for the repeat fields
        sort($varRetFieldsLength);  // Puts the largest number into position 1
        $numRows = $varRetFieldsLength[1];
    } else {
        $varRetFieldsLength = array(count($_POST["Org"]), count($_POST["adventureBranch"]), count($_POST["magicItemNumber"]));  // these three arrays determine the base index for the repeat fields
        sort($varRetFieldsLength);  // Puts the largest number into position 2
        $numRows = $varRetFieldsLength[2];
    }
    // echo $numRows;
    // Plan: use the fputcsv function to format each row into CSV format. Place each row into an array and then output the entire lot to the browser
    // Lets set up some global vars to use elsewhere in the script
    $playerStatus = "Active"; //As they submitted a return, assume they are an active player
    $endBalance = ($_POST["Balance_crowns"] * 12) + $_POST["Balance_pennies"];  // Put our balances into Pennies for insertion into Justin's spreadsheet.
    $totalIncome = ($_POST["Total_income_crowns"] * 12) + $_POST["Total_income_pennies"];
    $orgArray = $_POST["Org"];
    $orgRankArray = $_POST["Rank"];
    $feeCrownsArray = $_POST["Fees_Crowns"];
    $feePenniesArray = $_POST["Fees_Pennies"];
    if (array_key_exists("AdvanceID", $_POST)) { // Check for no advance
        $advanceID = $_POST["AdvanceID"] - 1; //Convert to match 0 index
    } else {
        $advanceID = 9999; // Set a stupidly huge number that will never match the number of Orgs you can belong to
    }
    for ($advID = 0; $advID < $numRows; $advID++) { // Build an advanceArray with the * at the appropiate point
        if ($advanceID === $advID) {
            $advanceArray[$advID] = "*";
        } else {
            $advanceArray[$advID] = " ";
        }
    }
    $adventureArray = $_POST["adventureBranch"];
    $adventureNumArray = $_POST["adventureNumber"];
    if (array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        $magicItemNumArray = $_POST["magicItemNumber"];
        $magicItemArray = $_POST["magicItemName"];
    }
    // Remembering that our array goes Member Number, Character Status, Player name, Character name, Race, End Balance, Total Income, Guild/Church, Rank, Fee/Tithe, Advance, Number of Missions, Mission location, Magic item number, magic item name
    $rowCount = 0;  // This is our counter for which row we are working on

    if (!array_key_exists("magicItemNumber", $_POST)) { //No magic items submitted produces no key for this array
        $rowData = array($_POST["Membership_number"], $playerStatus, $_POST["Player_name"], $_POST["Character_name"], $_POST["Character_Race"], $endBalance, $totalIncome, $orgArray[$rowCount], $orgRankArray[$rowCount], ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount], $advanceArray[$rowCount], $adventureNumArray[$rowCount], $adventureArray[$rowCount], " ", " ");
    } else {
        $rowData = array($_POST["Membership_number"], $playerStatus, $_POST["Player_name"], $_POST["Character_name"], $_POST["Character_Race"], $endBalance, $totalIncome, $orgArray[$rowCount], $orgRankArray[$rowCount], ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount], $advanceArray[$rowCount], $adventureNumArray[$rowCount], $adventureArray[$rowCount], $magicItemNumArray[$rowCount], $magicItemArray[$rowCount]);
    }

    $row[$rowCount] = array_to_CSV($rowData);

    // That is the first row down.  Now we need to do the rest
    for ($rowCount = 1; $rowCount < $numRows; $rowCount++) {
        // First check if our key arrays contain any data
        if (!array_key_exists($rowCount, $orgArray)) {
            $orgDetails = array(" ", " ", " ", " ");
        } else {
            if (!array_key_exists($rowCount, $advanceArray)) {
                $orgDetails = array($orgArray[$rowCount], $orgRankArray[$rowCount], ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount], " ");
            } else {
                $orgDetails = array($orgArray[$rowCount], $orgRankArray[$rowCount], ($feeCrownsArray[$rowCount] * 12) + $feePenniesArray[$rowCount], $advanceArray[$rowCount]);
            }
        }

        if (!array_key_exists($rowCount, $adventureArray)) {
            $adventureDetails = array(" ", " ");
        } else {
            $adventureDetails = array($adventureNumArray[$rowCount], $adventureArray[$rowCount]);
        }

        if (!array_key_exists("magicItemNumber", $_POST)) {
            $magicItemDetails = array(" ", " ");
        } else {
            $magicItemDetails = array($magicItemNumArray[$rowCount], $magicItemArray[$rowCount]);
        }

        // now we have the relevant data build our row
        $rowData = array(" ", " ", " ", " ", " ", " ", " ", $orgDetails[0], $orgDetails[1], $orgDetails[2], $orgDetails[3], $adventureDetails[0], $adventureDetails[1], $magicItemDetails[0], $magicItemDetails[1]); // for use in Rows other than 1
        $row[$rowCount] = array_to_CSV($rowData);
    }

    foreach ($row as $rowOutput) {
        print $rowOutput;
    }
}

function array_to_CSV($data) {
    $outstream = fopen("php://temp", 'r+');
    fputcsv($outstream, $data, ',', '"');
    rewind($outstream);
    $csv = fgets($outstream);
    fclose($outstream);
    return $csv;
}

?>