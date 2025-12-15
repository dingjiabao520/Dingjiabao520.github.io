using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 天气数据表 - 存储天气信息
    /// </summary>
    public class WeatherData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long WeatherID { get; set; }
        
        [Required]
        public DateOnly RecordDate { get; set; }
        
        [Required]
        public TimeOnly RecordTime { get; set; }
        
        public decimal? Temperature { get; set; }
        
        public decimal? Humidity { get; set; }
        
        public decimal? WindSpeed { get; set; }
        
        [MaxLength(20)]
        public string WindDirection { get; set; }
        
        [MaxLength(50)]
        public string WeatherCondition { get; set; } // 天气状况（晴、多云、雨等）
        
        public decimal? Precipitation { get; set; } // 降水量
        
        public int? UVIndex { get; set; } // 紫外线指数
        
        public int? AirQualityIndex { get; set; } // 空气质量指数
        
        [MaxLength(100)]
        public string WeatherSource { get; set; } // 数据来源
    }
}