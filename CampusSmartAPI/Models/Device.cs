using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 设备表 - 用于管理校园内的监测设备
    /// </summary>
    public class Device
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DeviceID { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string DeviceName { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string DeviceType { get; set; } // 环境监测设备、交通监测设备等
        
        [Required]
        [MaxLength(200)]
        public string Location { get; set; } // 设备安装位置
        
        [Required]
        public DateTime InstallationDate { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "正常"; // 正常、故障、维护中
        
        public DateTime? LastMaintenanceDate { get; set; }
        
        public decimal? Longitude { get; set; }
        
        public decimal? Latitude { get; set; }
        
        [Required]
        public bool IsActive { get; set; } = true;
        
        // 导航属性
        public ICollection<EnvironmentData> EnvironmentData { get; set; }
        public ICollection<TrafficData> TrafficData { get; set; }
    }
}