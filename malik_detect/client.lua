local voice = false
local check = false
local displayingPluginScreen = false

AddEventHandler("SaltyChat_TalkStateChanged", function(isTalking)
    if isTalking then
        voice = true
    end
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1)

		if IsControlJustPressed(0, 0x8FD015D8) then --W
			check = true
		end
    end
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1)
		
		if check then 
			if not voice then
				DrawTxt("~e~Salty Chat plugin non è connesso ~n~~q~Entra nel nostro teamspeak: ~o~ts3.voicehosting.it:15067 ~n~~q~Accertati di avere ~e~Salty Chat ~q~installato e abilitato ~n~Entra su ~o~discord.gg/SHQSXSC ~q~e chiedi supporto se hai problemi. ~n~~n~Premi il pulsante di ~t6~Push to talk ~q~se hai già installato la SaltyChat.", 0.50, 0.0, 0.6, 0.6, true, 161, 3, 0, 255, true, 10000)
				FreezeEntityPosition(GetPlayerPed(), true)
			else
				FreezeEntityPosition(GetPlayerPed(), false)
			end
		end
    end
end)


function DrawTxt(str, x, y, w, h, enableShadow, col1, col2, col3, a, centre)
 local str = CreateVarString(10, "LITERAL_STRING", str, Citizen.ResultAsLong())
	SetTextScale(w, h)
	SetTextColor(math.floor(col1), math.floor(col2), math.floor(col3), math.floor(a))
	SetTextCentre(centre)
    if enableShadow then SetTextDropshadow(1, 0, 0, 0, 255) end
	Citizen.InvokeNative(0xADA9255D, 10);
	DisplayText(str, x, y)
end