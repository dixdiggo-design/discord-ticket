require("dotenv").config();

const http = require("http");
const {
    Client,
    GatewayIntentBits,
    Events,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

// ===============================
// SERVIDOR HTTP PARA O RENDER
// ===============================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("Bot online!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
});

// ===============================
// CLIENT DISCORD
// ===============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// ===============================
// BOT ONLINE
// ===============================

client.once(Events.ClientReady, (bot) => {
    console.log(`✅ Bot online como ${bot.user.tag}`);
});

// ===============================
// INTERAÇÕES
// ===============================

client.on(Events.InteractionCreate, async (interaction) => {

    try {

        // ===============================
        // /PAINEL
        // ===============================

        if (interaction.isChatInputCommand()) {

            if (interaction.commandName === "painel") {

                const embed = new EmbedBuilder()
                    .setTitle("🎫 Central de Atendimento")
                    .setDescription(
                        "Precisa de ajuda?\n\n" +
                        "Clique no botão abaixo para abrir um ticket com nossa equipe."
                    )
                    .setColor("#5865F2")
                    .setFooter({
                        text: "Sistema de Tickets"
                    });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("abrir_ticket")
                            .setLabel("Abrir Ticket")
                            .setEmoji("🎫")
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.reply({
                    embeds: [embed],
                    components: [row]
                });

                return;
            }
        }

        // ===============================
        // BOTÃO ABRIR TICKET
        // ===============================

        if (
            interaction.isButton() &&
            interaction.customId === "abrir_ticket"
        ) {

            // Responde imediatamente ao Discord
            await interaction.deferReply({
                ephemeral: true
            });

            const guild = interaction.guild;
            const user = interaction.user;

            // Verifica se já existe ticket
            const ticketExistente = guild.channels.cache.find(
                channel =>
                    channel.name === `ticket-${user.id}`
            );

            if (ticketExistente) {

                await interaction.editReply({
                    content: `❌ Você já possui um ticket aberto: ${ticketExistente}`
                });

                return;
            }

            // Cria o ticket
            const ticket = await guild.channels.create({
                name: `ticket-${user.id}`,
                type: ChannelType.GuildText,

                parent: process.env.TICKET_CATEGORY_ID,

                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [
                            PermissionFlagsBits.ViewChannel
                        ]
                    },

                    {
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },

                    {
                        id: process.env.STAFF_ROLE_ID,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Embed do ticket
            const embed = new EmbedBuilder()
                .setTitle("🎫 Ticket Aberto")
                .setDescription(
                    `Olá ${user}!\n\n` +
                    "A equipe irá atender você em breve.\n\n" +
                    "Utilize os botões abaixo para gerenciar o ticket."
                )
                .setColor("#5865F2");

            const row = new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId("fechar_ticket")
                        .setLabel("Fechar")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId("excluir_ticket")
                        .setLabel("Excluir")
                        .setEmoji("🗑️")
                        .setStyle(ButtonStyle.Danger)

                );

            await ticket.send({
                content: `${user} <@&${process.env.STAFF_ROLE_ID}>`,
                embeds: [embed],
                components: [row]
            });

            await interaction.editReply({
                content: `✅ Ticket criado com sucesso: ${ticket}`
            });

            return;
        }

        // ===============================
        // FECHAR TICKET
        // ===============================

        if (
            interaction.isButton() &&
            interaction.customId === "fechar_ticket"
        ) {

            await interaction.deferReply({
                ephemeral: true
            });

            const channel = interaction.channel;

            await channel.permissionOverwrites.edit(
                interaction.user.id,
                {
                    ViewChannel: true,
                    SendMessages: false
                }
            );

            await channel.setName(
                `fechado-${interaction.user.id}`
            );

            await interaction.editReply({
                content: "🔒 Ticket fechado com sucesso."
            });

            return;
        }

        // ===============================
        // EXCLUIR TICKET
        // ===============================

        if (
            interaction.isButton() &&
            interaction.customId === "excluir_ticket"
        ) {

            await interaction.reply({
                content: "🗑️ Excluindo ticket...",
                ephemeral: true
            });

            setTimeout(async () => {

                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error("Erro ao excluir ticket:", error);
                }

            }, 3000);

            return;
        }

    } catch (error) {

        console.error("❌ Erro na interação:", error);

        try {

            if (interaction.deferred || interaction.replied) {

                await interaction.editReply({
                    content: "❌ Ocorreu um erro ao processar essa ação."
                });

            } else {

                await interaction.reply({
                    content: "❌ Ocorreu um erro ao processar essa ação.",
                    ephemeral: true
                });

            }

        } catch (replyError) {

            console.error(
                "❌ Não foi possível responder à interação:",
                replyError
            );

        }

    }

});

// ===============================
// ERROS
// ===============================

process.on("unhandledRejection", (error) => {
    console.error("❌ Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
});

// ===============================
// LOGIN
// ===============================

console.log("🔄 Iniciando o bot...");

client.login(process.env.DISCORD_TOKEN);