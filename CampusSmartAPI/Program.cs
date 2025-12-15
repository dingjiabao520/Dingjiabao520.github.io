using CampusSmartAPI.Data;
using CampusSmartAPI.Repositories;
using CampusSmartAPI.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// 配置数据库连接
builder.Services.AddDbContext<CampusSmartDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CampusSmartDB")));

// 配置Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "CampusSmartAPI", Version = "v1" });
});

// 添加控制器
builder.Services.AddControllers();

// 注册数据访问层 - 泛型Repository
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// 注册业务逻辑层服务
builder.Services.AddScoped<IDeviceService, DeviceService>();
builder.Services.AddScoped<IEnvironmentService, EnvironmentService>();
builder.Services.AddScoped<IModelImportService, ModelImportService>(); // 注册模型导入服务

// 配置外部API服务
builder.Services.AddHttpClient<IExternalApiService, ExternalApiService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// 注册后台服务（数据同步服务）
builder.Services.AddHostedService<DataSyncService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "CampusSmartAPI v1"));
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
