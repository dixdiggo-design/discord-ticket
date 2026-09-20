
require("dotenv").config();

const http = require("http");

/* =========================================================
   SERVIDOR HTTP PARA O RENDER
========================================================= */

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("Bot online!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
});

/* =========================================================
   DISCORD.JS
========================================================= */

const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

/* =========================================================
   BOT ONLINE
========================================================= */

client.once(Events.ClientReady, () => {

    console.log("======================================");
    console.log("        🤖 BOT ONLINE!");
    console.log("======================================");
    console.log(`👤 Nome: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log("======================================");

});

/* =========================================================
   INTERAÇÕES
========================================================= */

client.on(Events.InteractionCreate, async interaction => {

    console.log(
        `📩 Interação: ${
            interaction.commandName ||
            interaction.customId ||
            "desconhecida"
        }`
    );

    try {

        /* =====================================================
           /PAINEL
        ===================================================== */

        if (
            interaction.isChatInputCommand() &&
            interaction.commandName === "painel"
        ) {

            console.log("🟢 /painel executado!");

            const embed = new EmbedBuilder()

                .setColor("#5865F2")

                .setAuthor({
                    name: "Central de Atendimento"
                })

                .setTitle("🎫 Suporte | Abra seu Ticket")

                .setDescription(
                    "Precisa falar com nossa equipe?\n\n" +

                    "Abra um ticket através do botão abaixo e " +
                    "explique detalhadamente o que você precisa.\n\n" +

                    "╭──────────────────────────────╮\n" +
                    "│ 🛒 **Compras**\n" +
                    "│ 💰 **Financeiro**\n" +
                    "│ 🛠️ **Suporte**\n" +
                    "│ 📩 **Outros assuntos**\n" +
                    "╰──────────────────────────────╯\n\n" +

                    "🔒 **Atendimento privado**\n" +
                    "Apenas você e nossa equipe terão acesso ao ticket.\n\n" +

                    "⏱️ **Atendimento**\n" +
                    "Nossa equipe responderá assim que possível."
                )

                .setThumbnail(
                    client.user.displayAvatarURL({
                        extension: "png",
                        size: 256
                    })
                )

                .setFooter({
                    text: `${interaction.guild.name} • Sistema de Tickets`,
                    iconURL:
                        interaction.guild.iconURL() || undefined
                })

                .setTimestamp();

            const abrirTicket = new ButtonBuilder()

                .setCustomId("abrir_ticket")

                .setLabel("Abrir Ticket")

                .setEmoji("🎫")

                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(abrirTicket);

            await interaction.channel.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: "✅ Painel enviado com sucesso!",
                ephemeral: true
            });

            console.log("✅ Painel enviado!");

            return;
        }

        /* =====================================================
           ABRIR TICKET
        ===================================================== */

        if (
            interaction.isButton() &&
            interaction.customId === "abrir_ticket"
        ) {

            console.log("🎫 Criando ticket...");

            const guild = interaction.guild;
            const user = interaction.user;

            const ticketExistente = guild.channels.cache.find(
                channel =>
                    channel.type === ChannelType.GuildText &&
                    (
                        channel.name === `ticket-${user.id}` ||
                        channel.name === `fechado-${user.id}`
                    )
            );

            if (ticketExistente) {

                await interaction.reply({
                    content:
                        `❌ Você já possui um ticket aberto ou fechado!\n\n` +
                        `🎫 ${ticketExistente}`,
                    ephemeral: true
                });

                return;
            }

            const ticket = await guild.channels.create({

                name: `ticket-${user.id}`,

                type: ChannelType.GuildText,

                parent: process.env.TICKET_CATEGORY_ID,

                permissionOverwrites: [

                    {
                        id: guild.roles.everyone.id,

                        deny: [
                            PermissionFlagsBits.ViewChannel
                        ]
                    },

                    {
                        id: user.id,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },

                    {
                        id: process.env.STAFF_ROLE_ID,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.AttachFiles
                        ]
                    },

                    {
                        id: client.user.id,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }

                ]

            });

            const embed = new EmbedBuilder()

                .setColor("#57F287")

                .setTitle("🎫 Ticket Aberto")

                .setDescription(
                    `Olá ${user}! 👋\n\n` +
                    "Seu atendimento foi criado com sucesso.\n\n" +
                    "📋 **Envie sua solicitação abaixo.**\n" +
                    "Explique detalhadamente o que você precisa " +
                    "para que nossa equipe possa ajudar.\n\n" +
                    "🔒 **Ticket privado**\n" +
                    "Somente você e nossa equipe possuem acesso.\n\n" +
                    "⏱️ Aguarde um membro da equipe responder."
                )

                .addFields({
                    name: "👤 Cliente",
                    value: `${user}`,
                    inline: true
                })

                .addFields({
                    name: "🆔 ID",
                    value: `${user.id}`,
                    inline: true
                })

                .setFooter({
                    text: `${guild.name} • Atendimento`
                })

                .setTimestamp();

            const fechar = new ButtonBuilder()
                .setCustomId("fechar_ticket")
                .setLabel("Fechar Ticket")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Danger);

            const excluir = new ButtonBuilder()
                .setCustomId("excluir_ticket")
                .setLabel("Excluir Ticket")
                .setEmoji("🗑️")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(
                    fechar,
                    excluir
                );

            await ticket.send({
                content:
                    `${user} <@&${process.env.STAFF_ROLE_ID}>`,
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content:
                    `✅ Seu ticket foi criado com sucesso!\n\n` +
                    `🎫 ${ticket}`,
                ephemeral: true
            });

            console.log(
                `✅ Ticket criado: ${ticket.name}`
            );

            return;
        }

        /* =====================================================
           FECHAR TICKET
        ===================================================== */

        if (
            interaction.isButton() &&
            interaction.customId === "fechar_ticket"
        ) {

            console.log("🔒 Fechando ticket...");

            if (
                !interaction.channel.name.startsWith("ticket-")
            ) {

                await interaction.reply({
                    content:
                        "❌ Este canal não é um ticket.",
                    ephemeral: true
                });

                return;
            }

            const usuarioId =
                interaction.channel.name.replace(
                    "ticket-",
                    ""
                );

            await interaction.channel.setName(
                `fechado-${usuarioId}`
            );

            try {

                await interaction.channel.permissionOverwrites.edit(
                    usuarioId,
                    {
                        ViewChannel: false,
                        SendMessages: false
                    }
                );

            } catch (error) {

                console.log(
                    "⚠️ Não foi possível remover o usuário:",
                    error.message
                );

            }

            const embed = new EmbedBuilder()
                .setColor("#ED4245")
                .setTitle("🔒 Ticket Fechado")
                .setDescription(
                    "Este ticket foi fechado pela equipe.\n\n" +
                    "🗑️ Utilize **Excluir Ticket** para remover " +
                    "o canal permanentemente."
                )
                .setTimestamp();

            await interaction.channel.send({
                embeds: [embed]
            });

            await interaction.reply({
                content:
                    "🔒 Ticket fechado com sucesso!",
                ephemeral: true
            });

            console.log("✅ Ticket fechado!");

            return;
        }

        /* =====================================================
           EXCLUIR TICKET
        ===================================================== */

        if (
            interaction.isButton() &&
            interaction.customId === "excluir_ticket"
        ) {

            console.log("🗑️ Excluindo ticket...");

            if (
                !interaction.channel.name.startsWith("ticket-") &&
                !interaction.channel.name.startsWith("fechado-")
            ) {

                await interaction.reply({
                    content:
                        "❌ Este canal não é um ticket.",
                    ephemeral: true
                });

                return;
            }

            await interaction.reply({
                content:
                    "🗑️ **Ticket será excluído em 3 segundos...**"
            });

            setTimeout(async () => {

                try {

                    await interaction.channel.delete();

                    console.log(
                        "✅ Ticket excluído!"
                    );

                } catch (error) {

                    console.error(
                        "❌ Erro ao excluir ticket:",
                        error
                    );

                }

            }, 3000);

            return;
        }

    } catch (error) {

        console.error(
            "❌ ERRO NA INTERAÇÃO:"
        );

        console.error(error);

        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            try {

                await interaction.reply({
                    content:
                        "❌ Ocorreu um erro ao executar esta ação.",
                    ephemeral: true
                });

            } catch {}

        }

    }

});

/* =========================================================
   ERROS
========================================================= */

client.on("error", error => {

    console.error(
        "❌ Erro do Discord:",
        error
    );

});

process.on("unhandledRejection", error => {

    console.error(
        "❌ Erro não tratado:",
        error
    );

});

/* =========================================================
   LOGIN
========================================================= */

console.log(
    "🔄 Iniciando o bot..."
);

client.login(
    process.env.DISCORD_TOKEN
)

.then(() => {

    console.log(
        "🔑 Login realizado com sucesso!"
    );

})

.catch(error => {

    console.error(
        "❌ ERRO AO FAZER LOGIN:"
    );

    console.error(error);

});

