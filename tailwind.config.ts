import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-warm': 'var(--gradient-warm)',
				'gradient-cool': 'var(--gradient-cool)',
				'gradient-dark': 'var(--gradient-dark)',
				'gradient-neon': 'var(--gradient-neon)',
				'gradient-aurora': 'var(--gradient-aurora)',
				'gradient-cyberpunk': 'var(--gradient-cyberpunk)',
				'gradient-sunset': 'var(--gradient-sunset)'
			},
			backdropBlur: {
				xs: '2px',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					from: {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					from: {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-left': {
					from: {
						opacity: '0',
						transform: 'translateX(-30px)'
					},
					to: {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'slide-in-right': {
					from: {
						opacity: '0',
						transform: 'translateX(30px)'
					},
					to: {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'bounce-smooth': {
					'0%, 20%, 53%, 80%, 100%': {
						transform: 'translateY(0)'
					},
					'40%, 43%': {
						transform: 'translateY(-15px)'
					},
					'70%': {
						transform: 'translateY(-7px)'
					},
					'90%': {
						transform: 'translateY(-2px)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'pulse-soft': {
					'0%, 100%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.8',
						transform: 'scale(1.05)'
					}
				},
				'glow': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(102, 126, 234, 0.5)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(102, 126, 234, 0.8), 0 0 30px rgba(102, 126, 234, 0.6)'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				},
				'gradient-shift': {
					'0%, 100%': {
						backgroundPosition: '0% 50%'
					},
					'50%': {
						backgroundPosition: '100% 50%'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
				'slide-up': 'slide-up 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
				'slide-in-left': 'slide-in-left 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
				'slide-in-right': 'slide-in-right 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
				'bounce-smooth': 'bounce-smooth 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'float': 'float 3s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'gradient-shift': 'gradient-shift 3s ease infinite'
			},
			transitionTimingFunction: {
				'bounce-smooth': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
				'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
