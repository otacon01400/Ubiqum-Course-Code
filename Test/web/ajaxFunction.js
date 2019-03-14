var app = new Vue(
{
    el: '#app',
    data: {
      selectValue: "All States",
      checkBoxValues: ['D','R','I'],
      membersRaw: [],
      membersFiltered: [],
      statisticsNumbers: [],      
      statisticsAttendance: [],
      statisticsLoyalty: [],
    },
    methods: {
      getSelectInput: function() {
        let select = document.getElementById('stateSelect').value;
        console.log(select);
        this.selectValue = select;
        return this.selectValue;
      },
      getCheckedBoxes: function() {
        let checkboxes = document.getElementsByName('party');
        let checkboxesChecked = [];
        for (let i=0; i<checkboxes.length; i++)
        {
          // And stick the checked ones onto an array...
          if (checkboxes[i].checked) {
              checkboxesChecked.push(checkboxes[i].value);
          }
        }
        this.checkBoxValues = checkboxesChecked;
        // Return the array if it is non-empty, or return null
        return this.checkBoxValues.length > 0 ? this.checkBoxValues : [];
      },

    /*applyFilter: function(member)          //Conditional Rendering, Same Array
      {       
        if(member.state == this.selectValue || this.selectValue == "All States")
        {
          for(let checkboxIndex = 0; checkboxIndex < this.checkBoxValues.length; checkboxIndex++)
          {
            if(member.party == this.checkBoxValues[checkboxIndex]) return true;
          }
          return false; 
        }
        else return false;
      }*/

      applyFilter: function()                //Conditions modify array, rendered always
      {
        let checkBoxesInput = this.getCheckedBoxes();
        let selectInput = this.getSelectInput();
        let filteredArray = [];
        
        this.membersRaw.map(function(member)
        {
          if(member.state == selectInput || selectInput == "All States")
          {
            for(let checkboxIndex = 0; checkboxIndex < checkBoxesInput.length; checkboxIndex++)
            {
              if(member.party == checkBoxesInput[checkboxIndex])
              {
                filteredArray.push(member);
                break;
              } 
            }
          }
        });

        this.membersFiltered = filteredArray;
        return this.membersFiltered;
      }
    },
});

function requestData(type)
{
    var dataFromFetch = fetch("https://api.propublica.org/congress/v1/113/" + type + "/members.json",
    {
      method: 'GET',
      headers: new Headers
      ({
          'X-API-Key': 'LHFuatuMJ0EzGOGpgV4mypJRubittqOpxDtO2uRs',
      }),
      mode: 'cors',
    })
    .then(function(response)
    {
        if (response.status !== 200)
        {
          console.log('Looks like there was a problem. Status Code: ' + response.status);
           return;
        }
        return response.json();
    })
    .catch(function(err)
    {
        console.log('Fetch Error :-S', err);
    });

    return dataFromFetch;
}

function extractValueForApp(remoteData)
{
    remoteData.then(function postToApp(response)
    {
        app.membersRaw = response.results[0].members;
        app.membersFiltered = app.membersRaw; //All members on default
        app.statisticsNumbers = statisticsSetup(app.membersRaw, "numbers");
        app.statisticsAttendance = statisticsSetup(app.membersRaw, "attendance");
        app.statisticsLoyalty = statisticsSetup(app.membersRaw, "loyalty");
        document.getElementById("stateSelect").innerHTML=selectOptions(app.membersRaw);      
    });
}

function statisticsSetup(rawData, dataSelector) //Store all data, now ready, in the obj object
{
      var obj = {};
      const membersLength = rawData.length;           //shortcut for the json members list length
      const membersLs = rawData;                      //shortcut for the json members list
      const partiesArray = getPartiesArray(membersLs);

      if(dataSelector == "numbers")
      {
            obj = { "democrats": [],"republicans":[],"independents":[],"total": []};
            obj = firstTableData(obj, partiesArray); //Set data for first table here
      }
      
      else if(dataSelector == "attendance")
      {
            obj= {
              "most_missed_members": voteTablesData(membersLs, membersLength, dataSelector, 1),
              "least_missed_members": voteTablesData(membersLs, membersLength, dataSelector, 0)
            };
      }
      else if(dataSelector == "loyalty")
      {
            obj= {
              "least_loyal_members": voteTablesData(membersLs, membersLength, dataSelector, 0),
              "most_loyal_members": voteTablesData(membersLs, membersLength, dataSelector, 1)
            };
      }
      return obj;
}

function getPartiesArray(members) 
{
    var democrats = []; //     Storing all members with complete data from every party
    var republicans = []; //
    var independents = []; //

    members.map(function(member)
    {
      member.party == "D" ? democrats.push(member) : member.party == "R" ? republicans.push(member) : independents.push(member);
    });

    var partiesArray = [democrats,republicans,independents];
    return partiesArray;
}

function firstTableData(obj, parties) //Fill statistics array with data required for first table.
{                                    //Number of members in each party and % of votes with his party
    var d_votes = 0;
    var r_votes = 0;
    var i_votes = 0;

    obj.total = {
      "name": "Total",
      "numbers": 0,
      "pct": 0,
    };

  for(let counter=0; counter < parties.length; counter ++)
  {
    for (let x = 0; x < parties[counter].length; x++)
    {
      if(counter == 0) d_votes += parties[counter][x].votes_with_party_pct;
      else if(counter == 1) r_votes += parties[counter][x].votes_with_party_pct;
      else if(counter == 2) i_votes += parties[counter][x].votes_with_party_pct;
    }
    if(counter == 0) 
    {
        obj.democrats = {
          "name": "Democrats",
          "numbers" : parties[counter].length,
          "pct" : +((d_votes/parties[0].length)).toFixed(2) || 0,
        };
        obj.total.pct += obj.democrats.pct;
    }
    else if(counter == 1)
    {
        obj.republicans = {
          "name": "Republicans",
          "numbers" : parties[counter].length,
          "pct" : +((r_votes/parties[1].length)).toFixed(2) || 0,
        };
        obj.total.pct += obj.republicans.pct;
    }
    else if(counter == 2)
    {
        obj.independents = {
          "name": "Independents",
          "numbers" : parties[counter].length,
          "pct" : +((i_votes/parties[2].length)).toFixed(2) || 0,
        };
        obj.total.pct += obj.independents.pct; 
    }

    obj.total.numbers += parties[counter].length;
  }
  obj.total.pct = +((obj.total.pct/parties.length)).toFixed(2) || 0;

  return obj;
}

function voteTablesData(members, length, dataSelector, pctSelector) //0 to get the least voted pct, 1 for the most
{
    var votesLsMixed;
    var votesLsArranged = [];
    var membersList = [];
    var minNumberValues = 0;
    var membersInIndex = [];

    if(dataSelector == "attendance")
    {
      votesLsMixed = members.map(function(x){return x.missed_votes_pct;});

      votesLsMixed = pctSelector ? votesLsMixed.sort(sortingAscendent) : votesLsMixed.sort(sortingDescendent); //Sort them depending on pctSelector value

      while(length*0.1 > votesLsArranged.length)
      {
        votesLsArranged.push(votesLsMixed[minNumberValues]);
        minNumberValues++;
      }

      for (var j = 0; j < votesLsArranged.length; j++) //Look for the member according to it's vote. Avoid getting the same member more than once storing it's index
      {                                              //If we have the 10%, stop looking for with "break"
        for(var u = 0; u < length; u++)
        {
          if(membersInIndex.indexOf(u) == -1 && votesLsArranged[j] == members[u].missed_votes_pct)
          {
            membersList.push(members[u]);
            membersInIndex.push(u);
            break;
          }
        }
      }
    }
    else if(dataSelector == "loyalty")
    {
      votesLsMixed = members.map(function(x){return x.votes_with_party_pct;});

      votesLsMixed = pctSelector ? votesLsMixed.sort(sortingDescendent) : votesLsMixed.sort(sortingAscendent); //Sort them depending on pctSelector value

      while(length*0.1 > votesLsArranged.length)
      {
        votesLsArranged.push(votesLsMixed[minNumberValues]);
        minNumberValues++;
      }

      for (var x = 0; x < votesLsArranged.length; x++) //Look for the member according to it's vote. Avoid getting the same member more than once storing it's index
      {                                              //If we have the 10%, stop looking for with "break"
        for(var y = 0; y < length; y++)
        {
          if(membersInIndex.indexOf(y) == -1 && votesLsArranged[x] == members[y].votes_with_party_pct)
          {
            membersList.push(members[y]);
            membersInIndex.push(y);
            break;
          }
        }
      }
    }

    return membersList;
}

function sortingAscendent(a,b){ //Sort numbers from lowest to highest
  return a > b ? 1 : b > a ? -1 : 0;
}

function sortingDescendent(a,b){ //Sort numbers from highest to lowest
  return a > b ? -1 : b > a ? 1 : 0;
}

function selectOptions(rawData)  //Draws the Select Box Options
  {
    var statesRow = ["<option value='All States'>All States</option>"];
    var states = [];

    for (var i = 0; i < rawData.length; i++)
    {
      if(states.indexOf(rawData[i].state) < 0) states.push(rawData[i].state);
    }
    for (var x = 0; x < states.length; x++) {
      statesRow.push("<option value=" + states[x] + ">" + states[x] + "</option>");
    }
    return statesRow.join("");
}