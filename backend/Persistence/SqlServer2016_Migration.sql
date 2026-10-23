IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] int NOT NULL IDENTITY,
        [Action] nvarchar(80) NOT NULL,
        [EntityName] nvarchar(80) NOT NULL,
        [EntityId] nvarchar(50) NOT NULL,
        [PerformedBy] nvarchar(80) NOT NULL,
        [Summary] nvarchar(600) NOT NULL,
        [IpAddress] nvarchar(50) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [ClubSettings] (
        [Id] int NOT NULL IDENTITY,
        [ClubName] nvarchar(150) NOT NULL,
        [ShortDescription] nvarchar(300) NOT NULL,
        [ContactPhone] nvarchar(30) NOT NULL,
        [ContactEmail] nvarchar(150) NOT NULL,
        [DefaultBankName] nvarchar(80) NOT NULL,
        [DefaultBankAccountNo] nvarchar(50) NOT NULL,
        [DefaultBankAccountName] nvarchar(120) NOT NULL,
        [DefaultShuttlecockPrice] decimal(18,2) NOT NULL,
        [DefaultFixedFeePerSession] decimal(18,2) NOT NULL,
        [DefaultGuestSurcharge] decimal(18,2) NOT NULL,
        [CancellationDeadlineHours] int NOT NULL,
        [LateCancellationPenalty] decimal(18,2) NOT NULL,
        [AutoGenerateChargesOnAttendance] bit NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_ClubSettings] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(180) NOT NULL,
        [Message] nvarchar(600) NOT NULL,
        [Type] nvarchar(40) NOT NULL,
        [TargetRole] nvarchar(40) NULL,
        [TargetPlayerId] int NULL,
        [IsRead] bit NOT NULL,
        [ActionUrl] nvarchar(200) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [Players] (
        [Id] int NOT NULL IDENTITY,
        [MemberCode] nvarchar(32) NOT NULL,
        [FullName] nvarchar(120) NOT NULL,
        [PhoneNumber] nvarchar(25) NOT NULL,
        [Email] nvarchar(150) NULL,
        [Gender] nvarchar(20) NOT NULL,
        [SkillLevel] int NOT NULL,
        [MembershipType] int NOT NULL,
        [Balance] decimal(18,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [JoinedDate] datetime2 NOT NULL,
        [Notes] nvarchar(500) NULL,
        [AvatarUrl] nvarchar(300) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Players] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [Venues] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(150) NOT NULL,
        [Address] nvarchar(300) NOT NULL,
        [ContactPhone] nvarchar(30) NOT NULL,
        [DefaultHourlyRate] decimal(18,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [Notes] nvarchar(500) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Venues] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [Username] nvarchar(64) NOT NULL,
        [Email] nvarchar(150) NOT NULL,
        [PasswordHash] nvarchar(255) NOT NULL,
        [FullName] nvarchar(120) NOT NULL,
        [PhoneNumber] nvarchar(25) NOT NULL,
        [Role] int NOT NULL,
        [IsActive] bit NOT NULL,
        [LinkedPlayerId] int NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Users_Players_LinkedPlayerId] FOREIGN KEY ([LinkedPlayerId]) REFERENCES [Players] ([Id]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [Courts] (
        [Id] int NOT NULL IDENTITY,
        [VenueId] int NOT NULL,
        [CourtName] nvarchar(80) NOT NULL,
        [CourtCode] nvarchar(30) NOT NULL,
        [SurfaceType] nvarchar(100) NOT NULL,
        [HourlyRate] decimal(18,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Courts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Courts_Venues_VenueId] FOREIGN KEY ([VenueId]) REFERENCES [Venues] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [Sessions] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(180) NOT NULL,
        [SessionDate] datetime2 NOT NULL,
        [StartTime] time NOT NULL,
        [EndTime] time NOT NULL,
        [VenueId] int NOT NULL,
        [CourtsBookedText] nvarchar(150) NOT NULL,
        [MaxPlayers] int NOT NULL,
        [Status] int NOT NULL,
        [PricingMode] int NOT NULL,
        [CourtFeeTotal] decimal(18,2) NOT NULL,
        [ShuttlecockCountUsed] int NOT NULL,
        [ShuttlecockUnitPrice] decimal(18,2) NOT NULL,
        [OtherFeeTotal] decimal(18,2) NOT NULL,
        [FixedFeePerPlayer] decimal(18,2) NOT NULL,
        [GuestSurcharge] decimal(18,2) NOT NULL,
        [Notes] nvarchar(600) NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Sessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Sessions_Venues_VenueId] FOREIGN KEY ([VenueId]) REFERENCES [Venues] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [AttendanceRecords] (
        [Id] int NOT NULL IDENTITY,
        [SessionId] int NOT NULL,
        [PlayerId] int NOT NULL,
        [Status] int NOT NULL,
        [CheckInTimeUtc] datetime2 NULL,
        [IsGuest] bit NOT NULL,
        [ExtraGuestsCount] int NOT NULL,
        [MatchesPlayedCount] int NOT NULL,
        [Note] nvarchar(300) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_AttendanceRecords] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AttendanceRecords_Players_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [Players] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AttendanceRecords_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [Sessions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [CourtAssignments] (
        [Id] int NOT NULL IDENTITY,
        [SessionId] int NOT NULL,
        [CourtId] int NOT NULL,
        [MatchOrder] int NOT NULL,
        [TeamAPlayerNames] nvarchar(200) NOT NULL,
        [TeamBPlayerNames] nvarchar(200) NOT NULL,
        [TeamAScore] int NOT NULL,
        [TeamBScore] int NOT NULL,
        [Status] int NOT NULL,
        [StartTimeUtc] datetime2 NULL,
        [EndTimeUtc] datetime2 NULL,
        [Notes] nvarchar(300) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_CourtAssignments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CourtAssignments_Courts_CourtId] FOREIGN KEY ([CourtId]) REFERENCES [Courts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_CourtAssignments_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [Sessions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [Expenses] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Category] int NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [ExpenseDate] datetime2 NOT NULL,
        [SessionId] int NULL,
        [PaidBy] nvarchar(100) NOT NULL,
        [VendorName] nvarchar(150) NULL,
        [ReceiptNote] nvarchar(400) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Expenses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Expenses_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [Sessions] ([Id]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [SessionCharges] (
        [Id] int NOT NULL IDENTITY,
        [SessionId] int NOT NULL,
        [PlayerId] int NOT NULL,
        [BaseCourtShare] decimal(18,2) NOT NULL,
        [ShuttlecockShare] decimal(18,2) NOT NULL,
        [GuestFee] decimal(18,2) NOT NULL,
        [PenaltyOrDiscount] decimal(18,2) NOT NULL,
        [TotalDue] decimal(18,2) NOT NULL,
        [AmountPaid] decimal(18,2) NOT NULL,
        [PaymentStatus] int NOT NULL,
        [Note] nvarchar(300) NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_SessionCharges] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SessionCharges_Players_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [Players] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SessionCharges_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [Sessions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [SessionRegistrations] (
        [Id] int NOT NULL IDENTITY,
        [SessionId] int NOT NULL,
        [PlayerId] int NOT NULL,
        [IsGuest] bit NOT NULL,
        [GuestsBroughtCount] int NOT NULL,
        [Status] int NOT NULL,
        [RegisteredAtUtc] datetime2 NOT NULL,
        [Note] nvarchar(300) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_SessionRegistrations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SessionRegistrations_Players_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [Players] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SessionRegistrations_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [Sessions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE TABLE [PaymentTransactions] (
        [Id] int NOT NULL IDENTITY,
        [TransactionCode] nvarchar(50) NOT NULL,
        [PlayerId] int NOT NULL,
        [SessionChargeId] int NULL,
        [Amount] decimal(18,2) NOT NULL,
        [PaymentMethod] int NOT NULL,
        [Status] int NOT NULL,
        [PaidAtUtc] datetime2 NOT NULL,
        [ReferenceCode] nvarchar(100) NULL,
        [ConfirmedByUsername] nvarchar(80) NULL,
        [Note] nvarchar(300) NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_PaymentTransactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PaymentTransactions_Players_PlayerId] FOREIGN KEY ([PlayerId]) REFERENCES [Players] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PaymentTransactions_SessionCharges_SessionChargeId] FOREIGN KEY ([SessionChargeId]) REFERENCES [SessionCharges] ([Id]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_AttendanceRecords_PlayerId] ON [AttendanceRecords] ([PlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AttendanceRecords_SessionId_PlayerId] ON [AttendanceRecords] ([SessionId], [PlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_CreatedAtUtc] ON [AuditLogs] ([CreatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_CourtAssignments_CourtId] ON [CourtAssignments] ([CourtId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_CourtAssignments_SessionId] ON [CourtAssignments] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Courts_VenueId_CourtCode] ON [Courts] ([VenueId], [CourtCode]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_Expenses_ExpenseDate] ON [Expenses] ([ExpenseDate]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_Expenses_SessionId] ON [Expenses] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_PaymentTransactions_PlayerId] ON [PaymentTransactions] ([PlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_PaymentTransactions_SessionChargeId] ON [PaymentTransactions] ([SessionChargeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PaymentTransactions_TransactionCode] ON [PaymentTransactions] ([TransactionCode]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Players_MemberCode] ON [Players] ([MemberCode]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_Players_PhoneNumber] ON [Players] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_SessionCharges_PlayerId] ON [SessionCharges] ([PlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SessionCharges_SessionId_PlayerId] ON [SessionCharges] ([SessionId], [PlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_SessionRegistrations_PlayerId] ON [SessionRegistrations] ([PlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SessionRegistrations_SessionId_PlayerId] ON [SessionRegistrations] ([SessionId], [PlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_Sessions_SessionDate] ON [Sessions] ([SessionDate]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_Sessions_VenueId] ON [Sessions] ([VenueId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE INDEX [IX_Users_LinkedPlayerId] ON [Users] ([LinkedPlayerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022095108_InitialSqlServer2016Schema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261022095108_InitialSqlServer2016Schema', N'8.0.11');
END;
GO

COMMIT;
GO

