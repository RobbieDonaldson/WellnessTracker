const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    age: {
      type: Number,
      min: 1,
      max: 150,
    },
    weight: {
      type: Number,
      min: 50,
      max: 800,
    },
    weightUnit: {
      type: String,
      enum: ["lbs", "kg"],
      default: "lbs",
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 50 },
      zip: { type: String, trim: true, maxlength: 20 },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    wizardCompleted: {
      type: Boolean,
      default: false,
    },
    // MFA
    mfaEnabled: { type: Boolean, default: false },
    mfaMethod: { type: String, enum: ["totp", "email", "sms", ""], default: "" },
    totpSecret: { type: String, select: false },
    phone: { type: String, trim: true, default: "" },
    pendingOtp: { type: String, select: false },
    pendingOtpExpires: { type: Date, select: false },
    // Password reset
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
