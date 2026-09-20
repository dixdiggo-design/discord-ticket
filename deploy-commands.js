require("dotenv").config();

const {
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const commands = [
    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Envia o painel de tickets.")
].map(command => command.toJSON());

const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

async function registrar() {
    try {

        console.log("🔄 Registrando /painel...");
        console.log("CLIENT_ID:", process.env.CLIENT_ID);
        console.log("GUILD_ID:", process.env.GUILD_ID);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("=================================");
        console.log("✅ /painel registrado com sucesso!");
        console.log("=================================");

    } catch (error) {

        console.error("❌ ERRO AO REGISTRAR O COMANDO:");
        console.error(error);

    }
}

registrar();
