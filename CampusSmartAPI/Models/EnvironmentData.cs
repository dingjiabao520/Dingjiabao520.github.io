using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 环境监测数据表 - 存储环境监测数据
    /// </summary>
    public class EnvironmentData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long DataID { get; set; }
        
        [Required]
        public int DeviceID { get; set; }
        
        [Required]
        public DateTime RecordTime { get; set; } = DateTime.Now;
        
        public decimal? Temperature { get; set; } // 温度（摄氏度）
        
        public decimal? Humidity { get; set; } // 湿度（百分比）
        
        public decimal? WindSpeed { get; set; } // 风速（m/s）
        
        [MaxLength(20)]
        public string WindDirection { get; set; } // 风向
        
        public decimal? PM25 { get; set; } // PM2.5浓度
        
        public decimal? PM10 { get; set; } // PM10浓度
        
        public decimal? CO2 { get; set; } // CO2浓度
        
        public decimal? Noise { get; set; } // 噪音（分贝）
        
        // 导航属性
        [ForeignKey("DeviceID")]
        public Device Device { get; set; }
    }
}