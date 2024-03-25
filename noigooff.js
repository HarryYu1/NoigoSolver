if (gwc.userdata.noigoloop === undefined || gwc.userdata.noigoloop == 0){
    gwc.output.append('noigoloop is not running.');
    return;
  }
  clearInterval(gwc.userdata.noigoloop);
  gwc.output.append('disabled noigo loop.');
  gwc.userdata.noigoloop = 0;
